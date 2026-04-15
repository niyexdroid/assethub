import { pool } from '../../config/database';
import type { SearchInput } from './properties.validators';

export async function searchProperties(filters: SearchInput) {
  const conditions: string[] = ["p.approval_status = 'approved'", "p.is_available = true"];
  const params: any[]        = [];
  let   i                    = 1;

  const add = (cond: string, val: any) => { conditions.push(cond); params.push(val); };

  if (filters.listing_type)      add(`p.listing_type = $${i++}`,    filters.listing_type);
  if (filters.property_type)     add(`p.property_type = $${i++}`,   filters.property_type);
  if (filters.lga)               add(`p.lga ILIKE $${i++}`,         `%${filters.lga}%`);
  if (filters.bedrooms)          add(`p.bedrooms = $${i++}`,        filters.bedrooms);
  if (filters.tenancy_mode)      add(`p.tenancy_mode IN ($${i++}, 'both')`, filters.tenancy_mode);
  if (filters.near_university)   add(`p.nearest_university ILIKE $${i++}`, `%${filters.near_university}%`);
  if (filters.gender_preference && filters.gender_preference !== 'any')
                                 add(`p.gender_preference IN ($${i++}, 'any')`, filters.gender_preference);

  if (filters.min_rent) {
    add(`COALESCE(p.monthly_rent, p.yearly_rent/12) >= $${i++}`, filters.min_rent);
  }
  if (filters.max_rent) {
    add(`COALESCE(p.monthly_rent, p.yearly_rent/12) <= $${i++}`, filters.max_rent);
  }

  // Proximity filter using Haversine (requires lat/lng)
  if (filters.lat && filters.lng) {
    add(
      `(6371 * acos(cos(radians($${i++})) * cos(radians(p.latitude)) *
         cos(radians(p.longitude) - radians($${i++})) +
         sin(radians($${i - 2})) * sin(radians(p.latitude)))) <= $${i++}`,
      filters.lat
    );
    params.push(filters.lng, filters.radius_km);
    i += 2;
  }

  const sortMap: Record<string, string> = {
    newest:     'p.created_at DESC',
    price_asc:  'COALESCE(p.monthly_rent, p.yearly_rent/12) ASC',
    price_desc: 'COALESCE(p.monthly_rent, p.yearly_rent/12) DESC',
  };

  const offset = (filters.page - 1) * filters.limit;
  const where  = conditions.join(' AND ');

  const { rows } = await pool.query(
    `SELECT p.id, p.title, p.listing_type, p.property_type, p.address, p.lga,
            p.bedrooms, p.bathrooms, p.amenities, p.monthly_rent, p.yearly_rent,
            p.tenancy_mode, p.photos, p.caution_fee, p.available_units,
            p.nearest_university, p.gender_preference,
            u.first_name AS landlord_first_name, u.last_name AS landlord_last_name,
            p.created_at
     FROM properties p
     JOIN users u ON u.id = p.landlord_id
     WHERE ${where}
     ORDER BY ${sortMap[filters.sort]}
     LIMIT $${i++} OFFSET $${i++}`,
    [...params, filters.limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM properties p WHERE ${where}`, params
  );

  return {
    data:  rows,
    total: parseInt(countRows[0].count),
    page:  filters.page,
    limit: filters.limit,
  };
}
