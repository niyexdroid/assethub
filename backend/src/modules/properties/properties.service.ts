import { pool } from '../../config/database';
import type { CreatePropertyInput } from './properties.validators';

export class PropertiesService {
  async create(landlordId: string, input: CreatePropertyInput) {
    const { rows } = await pool.query(
      `INSERT INTO properties
         (landlord_id, listing_type, property_type, title, description, address, lga, state,
          latitude, longitude, nearest_landmark, nearest_university, bedrooms, bathrooms,
          amenities, monthly_rent, yearly_rent, caution_fee, agency_fee, tenancy_mode,
          available_units, rules, max_occupants, gender_preference, approval_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING *`,
      [
        landlordId, input.listing_type, input.property_type, input.title,
        input.description ?? null, input.address, input.lga, input.state,
        input.latitude ?? null, input.longitude ?? null,
        input.nearest_landmark ?? null, input.nearest_university ?? null,
        input.bedrooms ?? null, input.bathrooms ?? null,
        JSON.stringify(input.amenities), input.monthly_rent ?? null,
        input.yearly_rent ?? null, input.caution_fee, input.agency_fee,
        input.tenancy_mode, input.available_units,
        input.rules ?? null, input.max_occupants ?? null, input.gender_preference,
        'pending',
      ]
    );
    return rows[0];
  }

  async getById(id: string) {
    const { rows } = await pool.query(
      `SELECT p.*,
              u.first_name AS landlord_first_name,
              u.last_name  AS landlord_last_name,
              u.profile_photo_url AS landlord_photo,
              (SELECT COUNT(*) FROM complaints c
               JOIN tenancies t ON t.id = c.tenancy_id
               WHERE t.property_id = p.id AND c.status != 'closed') AS open_complaints
       FROM properties p
       JOIN users u ON u.id = p.landlord_id
       WHERE p.id = $1`,
      [id]
    );
    if (!rows[0]) throw Object.assign(new Error('Property not found'), { status: 404 });
    return rows[0];
  }

  async update(id: string, landlordId: string, input: Partial<CreatePropertyInput>) {
    const fields = Object.entries(input)
      .filter(([, v]) => v !== undefined)
      .map(([k, _], idx) => `${k} = $${idx + 3}`);

    if (!fields.length) throw Object.assign(new Error('No fields to update'), { status: 400 });

    const values = Object.values(input).filter(v => v !== undefined);
    const { rows } = await pool.query(
      `UPDATE properties SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $1 AND landlord_id = $2 RETURNING *`,
      [id, landlordId, ...values]
    );
    if (!rows[0]) throw Object.assign(new Error('Property not found or not yours'), { status: 404 });
    return rows[0];
  }

  async delete(id: string, landlordId: string) {
    await pool.query(
      `UPDATE properties SET is_available = false, approval_status = 'suspended', updated_at = NOW()
       WHERE id = $1 AND landlord_id = $2`,
      [id, landlordId]
    );
  }

  async addPhotos(id: string, landlordId: string, urls: string[]) {
    const { rows } = await pool.query(
      `UPDATE properties SET photos = photos || $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND landlord_id = $3 RETURNING photos`,
      [JSON.stringify(urls), id, landlordId]
    );
    if (!rows[0]) throw Object.assign(new Error('Property not found or not yours'), { status: 404 });
    return rows[0].photos;
  }

  async removePhoto(id: string, landlordId: string, photoUrl: string) {
    const { rows } = await pool.query(
      `UPDATE properties
       SET photos = (SELECT jsonb_agg(p) FROM jsonb_array_elements(photos) p WHERE p::text != $1),
           updated_at = NOW()
       WHERE id = $2 AND landlord_id = $3 RETURNING photos`,
      [JSON.stringify(photoUrl), id, landlordId]
    );
    if (!rows[0]) throw Object.assign(new Error('Property not found or not yours'), { status: 404 });
    return rows[0].photos;
  }

  async getLandlordProperties(landlordId: string) {
    const { rows } = await pool.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM tenancies t WHERE t.property_id = p.id AND t.status = 'active') AS active_tenants
       FROM properties p
       WHERE p.landlord_id = $1 AND p.approval_status != 'suspended'
       ORDER BY p.created_at DESC`,
      [landlordId]
    );
    return rows;
  }

  async saveProperty(tenantId: string, propertyId: string) {
    await pool.query(
      `INSERT INTO saved_properties (tenant_id, property_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [tenantId, propertyId]
    );
  }

  async unsaveProperty(tenantId: string, propertyId: string) {
    await pool.query(
      'DELETE FROM saved_properties WHERE tenant_id = $1 AND property_id = $2',
      [tenantId, propertyId]
    );
  }

  async getSavedProperties(tenantId: string) {
    const { rows } = await pool.query(
      `SELECT p.id, p.title, p.address, p.monthly_rent, p.yearly_rent, p.photos, p.lga
       FROM saved_properties sp
       JOIN properties p ON p.id = sp.property_id
       WHERE sp.tenant_id = $1 ORDER BY sp.saved_at DESC`,
      [tenantId]
    );
    return rows;
  }
}
