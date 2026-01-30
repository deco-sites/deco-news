/**
 * Script para testar a conexão com o banco de dados e ver os dados
 */

import { getDatabase } from "../mcp/mod.ts";

async function testDatabase() {
  const db = getDatabase();
  
  // ========== SOURCES ==========
  
  console.log("\n📊 === TABELA BLOG_SOURCES ===\n");
  const blogSourcesResult = await db.query(`SELECT * FROM blog_sources LIMIT 5`);
  if (blogSourcesResult.success) {
    console.log(`Total: ${blogSourcesResult.data?.length}`);
    blogSourcesResult.data?.forEach((s, i) => {
      console.log(`\n--- Source ${i + 1} ---`);
      console.log(JSON.stringify(s, null, 2));
    });
  } else {
    console.error("❌ Erro:", blogSourcesResult.error?.message);
  }

  console.log("\n📊 === TABELA REDDIT_SOURCES ===\n");
  const redditSourcesResult = await db.query(`SELECT * FROM reddit_sources LIMIT 5`);
  if (redditSourcesResult.success) {
    console.log(`Total: ${redditSourcesResult.data?.length}`);
    redditSourcesResult.data?.forEach((s, i) => {
      console.log(`\n--- Source ${i + 1} ---`);
      console.log(JSON.stringify(s, null, 2));
    });
  } else {
    console.error("❌ Erro:", redditSourcesResult.error?.message);
  }

  console.log("\n📊 === TABELA LINKEDIN_SOURCES ===\n");
  const linkedinSourcesResult = await db.query(`SELECT * FROM linkedin_sources LIMIT 5`);
  if (linkedinSourcesResult.success) {
    console.log(`Total: ${linkedinSourcesResult.data?.length}`);
    linkedinSourcesResult.data?.forEach((s, i) => {
      console.log(`\n--- Source ${i + 1} ---`);
      console.log(JSON.stringify(s, null, 2));
    });
  } else {
    console.error("❌ Erro:", linkedinSourcesResult.error?.message);
  }

  // ========== CONTENT + JOIN ==========
  
  console.log("\n\n📊 === BLOGS COM JOIN (por domínio) ===\n");
  // Extrai o domínio da URL usando substr e instr
  // Ex: https://aws.amazon.com/blogs/... -> aws.amazon.com
  const blogsJoinResult = await db.query(`
    SELECT 
      c.id,
      c.article_title,
      c.article_url,
      bs.name as source_name,
      bs.url as source_url,
      bs.type as source_type,
      bs.authority as source_authority,
      -- Extrair domínio do article_url (remove https:// e pega até a próxima /)
      SUBSTR(
        REPLACE(REPLACE(c.article_url, 'https://', ''), 'http://', ''),
        1,
        CASE 
          WHEN INSTR(REPLACE(REPLACE(c.article_url, 'https://', ''), 'http://', ''), '/') > 0 
          THEN INSTR(REPLACE(REPLACE(c.article_url, 'https://', ''), 'http://', ''), '/') - 1
          ELSE LENGTH(REPLACE(REPLACE(c.article_url, 'https://', ''), 'http://', ''))
        END
      ) as article_domain
    FROM contents c
    LEFT JOIN blog_sources bs ON 
      INSTR(c.article_url, REPLACE(REPLACE(bs.url, 'https://', ''), 'http://', '')) > 0
    LIMIT 10
  `);
  if (blogsJoinResult.success) {
    console.log(`Total: ${blogsJoinResult.data?.length}`);
    blogsJoinResult.data?.forEach((b, i) => {
      console.log(`\n--- Blog ${i + 1} ---`);
      console.log(JSON.stringify(b, null, 2));
    });
  } else {
    console.error("❌ Erro:", blogsJoinResult.error?.message);
  }

  console.log("\n\n📊 === REDDIT COM JOIN ===\n");
  const redditJoinResult = await db.query(`
    SELECT 
      r.id,
      r.title,
      r.subreddit,
      rs.name as source_name,
      rs.type as source_type,
      rs.authority as source_authority
    FROM reddit_content_scrape r
    LEFT JOIN reddit_sources rs ON r.subreddit = rs.subreddit
    LIMIT 5
  `);
  if (redditJoinResult.success) {
    console.log(`Total: ${redditJoinResult.data?.length}`);
    redditJoinResult.data?.forEach((r, i) => {
      console.log(`\n--- Reddit ${i + 1} ---`);
      console.log(JSON.stringify(r, null, 2));
    });
  } else {
    console.error("❌ Erro:", redditJoinResult.error?.message);
  }

  console.log("\n\n📊 === LINKEDIN COM JOIN ===\n");
  const linkedinJoinResult = await db.query(`
    SELECT 
      l.id,
      l.author_name,
      l.author_profile_url,
      ls.name as source_name,
      ls.type as source_type,
      ls.authority as source_authority
    FROM linkedin_content_scrape l
    LEFT JOIN linkedin_sources ls ON l.author_profile_url = ls.profile_url
    LIMIT 5
  `);
  if (linkedinJoinResult.success) {
    console.log(`Total: ${linkedinJoinResult.data?.length}`);
    linkedinJoinResult.data?.forEach((l, i) => {
      console.log(`\n--- LinkedIn ${i + 1} ---`);
      console.log(JSON.stringify(l, null, 2));
    });
  } else {
    console.error("❌ Erro:", linkedinJoinResult.error?.message);
  }

  console.log("\n\n✅ Teste concluído!\n");
}

testDatabase().catch(console.error);

