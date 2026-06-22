const { supabase } = require('../../db/db');

async function saveAnalysis(post, analysis) {
  const { data: painCluster } = await supabase
    .from('pain_clusters')
    .upsert({
      name: analysis.pain_cluster,
    })
    .select()
    .single();

  const { data: icpProfile } = await supabase
    .from('icp_profiles')
    .upsert({
      name: analysis.icp,
    })
    .select()
    .single();

  await supabase.from('post_analysis').insert({
    reddit_post_id: post.id,

    pain_cluster_id: painCluster.id,

    icp_profile_id: icpProfile.id,

    pain_cluster: analysis.pain_cluster,

    icp: analysis.icp,

    confidence: analysis.confidence,

    summary: analysis.summary,
  });

  await supabase
    .from('reddit_posts')
    .update({
      analyzed_at: new Date(),
    })
    .eq('id', post.id);
}

module.exports = {
  saveAnalysis,
};
