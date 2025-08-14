export async function insertReturning(table, values, client) {
  const { data, error } = await client.from(table).insert(values).select().single();
  if (error) throw error; 
  return data;
}

export async function deleteById(table, id, client) {
  const { data, error } = await client.from(table).delete().eq('id', id).select().single();
  if (error) throw error; 
  return data;
}