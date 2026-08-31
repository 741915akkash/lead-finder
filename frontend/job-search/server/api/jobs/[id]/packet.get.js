import { getSupabase } from '../../../utils/supabase';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  if (!Number.isInteger(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid job ID.',
    });
  }

  const query = getQuery(event);

  const type = query.type;

  if (type !== 'application' && type !== 'networking') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid packet type.',
    });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('job_postings')
    .select(
      `
        id,
        company,
        title,
        application_packet,
        networking_packet
      `,
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found.',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  const packet = type === 'application' ? data.application_packet : data.networking_packet;

  if (!packet) {
    throw createError({
      statusCode: 404,
      statusMessage: `${type === 'application' ? 'Application' : 'Networking'} packet not found.`,
    });
  }

  return {
    id: data.id,
    company: data.company,
    title: data.title,
    type,
    packet,
  };
});
