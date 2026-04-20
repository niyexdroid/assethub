import { pool } from '../../config/database';
import { calculateCompatibility } from './matching.algorithm';
import { NotificationsService } from '../notifications/notifications.service';
import type { RoommateProfileInput, MatchRequestInput } from './roommates.validators';

const notifSvc = new NotificationsService();

export class RoommatesService {
  async upsertProfile(tenantId: string, input: RoommateProfileInput) {
    const { rows } = await pool.query(
      `INSERT INTO roommate_profiles
         (tenant_id, property_id, gender, age_range_min, age_range_max,
          school, department, level, budget_min, budget_max,
          sleep_schedule, cleanliness, noise_tolerance, cooking_habits,
          smoker, pets_allowed, bio, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, true)
       ON CONFLICT (tenant_id) DO UPDATE SET
         property_id = $2, gender = $3, age_range_min = $4, age_range_max = $5,
         school = $6, department = $7, level = $8, budget_min = $9, budget_max = $10,
         sleep_schedule = $11, cleanliness = $12, noise_tolerance = $13,
         cooking_habits = $14, smoker = $15, pets_allowed = $16, bio = $17,
         is_active = true
       RETURNING *`,
      [
        tenantId,
        input.property_id ?? null,
        input.gender_preference ?? input.gender ?? null,
        input.age_range_min ?? null,
        input.age_range_max ?? null,
        input.school ?? null,
        input.department ?? null,
        input.level ?? null,
        input.budget_min,
        input.budget_max,
        input.sleep_schedule,
        input.cleanliness,
        input.noise_tolerance,
        input.cooking_habits ?? null,
        input.smoker,
        input.pets_allowed,
        input.bio ?? null,
      ]
    );
    return rows[0];
  }

  async getProfile(tenantId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM roommate_profiles WHERE tenant_id = $1',
      [tenantId]
    );
    return rows[0] ?? null;
  }

  async deactivateProfile(tenantId: string) {
    await pool.query(
      'UPDATE roommate_profiles SET is_active = false WHERE tenant_id = $1',
      [tenantId]
    );
  }

  /**
   * Returns scored matches for a given property, filtered by min_score from platform_settings.
   * Excludes the requesting tenant and any already-sent/accepted requests.
   */
  async getMatches(tenantId: string, propertyId: string) {
    // Get requesting tenant's profile
    const { rows: myRows } = await pool.query(
      'SELECT * FROM roommate_profiles WHERE tenant_id = $1 AND is_active = true',
      [tenantId]
    );
    if (!myRows[0]) throw Object.assign(new Error('Create a roommate profile first'), { status: 400 });
    const myProfile = myRows[0];

    // Get min score threshold from platform settings
    const { rows: settingRows } = await pool.query(
      `SELECT value FROM platform_settings WHERE key = 'match_min_score'`
    );
    const minScore = parseInt(settingRows[0]?.value ?? '60');

    // Get expiry days
    const { rows: expiryRows } = await pool.query(
      `SELECT value FROM platform_settings WHERE key = 'match_expiry_days'`
    );
    const expiryDays = parseInt(expiryRows[0]?.value ?? '7');

    // Get all other active profiles on same property
    const { rows: candidates } = await pool.query(
      `SELECT rp.*, u.first_name, u.last_name, u.profile_photo_url
       FROM roommate_profiles rp
       JOIN users u ON u.id = rp.tenant_id
       WHERE rp.property_id = $1
         AND rp.tenant_id   != $2
         AND rp.is_active   = true
         AND rp.tenant_id NOT IN (
           SELECT recipient_id FROM roommate_matches
           WHERE requester_id = $2 AND status IN ('pending','accepted')
           UNION
           SELECT requester_id FROM roommate_matches
           WHERE recipient_id = $2 AND status IN ('pending','accepted')
         )`,
      [propertyId, tenantId]
    );

    // Score and filter
    const scored = candidates
      .map(c => ({
        ...c,
        compatibility_score: calculateCompatibility(myProfile, c),
      }))
      .filter(c => c.compatibility_score >= minScore)
      .sort((a, b) => b.compatibility_score - a.compatibility_score);

    return { matches: scored, expiry_days: expiryDays };
  }

  async sendRequest(requesterId: string, input: MatchRequestInput) {
    // Check requester has a profile
    const { rows: profileRows } = await pool.query(
      'SELECT id FROM roommate_profiles WHERE tenant_id = $1 AND is_active = true',
      [requesterId]
    );
    if (!profileRows[0]) throw Object.assign(new Error('Create a roommate profile first'), { status: 400 });

    // Prevent duplicate requests
    const { rows: existing } = await pool.query(
      `SELECT id FROM roommate_matches
       WHERE requester_id = $1 AND recipient_id = $2 AND status IN ('pending','accepted')`,
      [requesterId, input.recipient_id]
    );
    if (existing[0]) throw Object.assign(new Error('Request already sent'), { status: 409 });

    // Get expiry setting
    const { rows: expiryRows } = await pool.query(
      `SELECT value FROM platform_settings WHERE key = 'match_expiry_days'`
    );
    const expiryDays = parseInt(expiryRows[0]?.value ?? '7');

    // Score the match
    const { rows: recipientProfile } = await pool.query(
      'SELECT * FROM roommate_profiles WHERE tenant_id = $1',
      [input.recipient_id]
    );
    const { rows: requesterProfile } = await pool.query(
      'SELECT * FROM roommate_profiles WHERE tenant_id = $1',
      [requesterId]
    );
    const score = recipientProfile[0] && requesterProfile[0]
      ? calculateCompatibility(requesterProfile[0], recipientProfile[0])
      : 0;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const { rows } = await pool.query(
      `INSERT INTO roommate_matches
         (requester_id, recipient_id, property_id, compatibility_score, message, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [requesterId, input.recipient_id, input.property_id, score, input.message ?? null, expiresAt]
    );

    // Notify recipient
    const { rows: requesterRows } = await pool.query(
      'SELECT first_name FROM users WHERE id = $1', [requesterId]
    );
    await notifSvc.send({
      userId:   input.recipient_id,
      type:     'new_match',
      title:    'New Roommate Request!',
      body:     `${requesterRows[0]?.first_name ?? 'Someone'} wants to be your roommate`,
      channels: ['whatsapp', 'push'],
      data:     { name: requesterRows[0]?.first_name },
    });

    return rows[0];
  }

  async respondToRequest(matchId: string, recipientId: string, action: 'accept' | 'decline') {
    const status = action === 'accept' ? 'accepted' : 'declined';
    const { rows } = await pool.query(
      `UPDATE roommate_matches SET status = $1
       WHERE id = $2 AND recipient_id = $3 AND status = 'pending'
       RETURNING *`,
      [status, matchId, recipientId]
    );
    if (!rows[0]) throw Object.assign(new Error('Request not found or already responded'), { status: 404 });

    if (action === 'accept') {
      // Notify requester
      const { rows: recipientRows } = await pool.query(
        'SELECT first_name FROM users WHERE id = $1', [recipientId]
      );
      await notifSvc.send({
        userId:   rows[0].requester_id,
        type:     'new_match',
        title:    'Roommate Request Accepted!',
        body:     `${recipientRows[0]?.first_name ?? 'Your match'} accepted your roommate request`,
        channels: ['whatsapp', 'push'],
        data:     { name: recipientRows[0]?.first_name },
      });
    }

    return rows[0];
  }

  async getReceivedRequests(tenantId: string) {
    const { rows } = await pool.query(
      `SELECT rm.*, u.first_name, u.last_name, u.profile_photo_url,
              rp.gender, rp.budget_min, rp.budget_max, rp.school, rp.bio
       FROM roommate_matches rm
       JOIN users u ON u.id = rm.requester_id
       JOIN roommate_profiles rp ON rp.tenant_id = rm.requester_id
       WHERE rm.recipient_id = $1
       ORDER BY rm.created_at DESC`,
      [tenantId]
    );
    return rows;
  }

  async getSentRequests(tenantId: string) {
    const { rows } = await pool.query(
      `SELECT rm.*, u.first_name, u.last_name, u.profile_photo_url
       FROM roommate_matches rm
       JOIN users u ON u.id = rm.recipient_id
       WHERE rm.requester_id = $1
       ORDER BY rm.created_at DESC`,
      [tenantId]
    );
    return rows;
  }
}
