const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

cloudinary.config(true);

async function run() {
  try {
    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload('test.png', { folder: 'knowledge_nodes' });
    console.log('Uploaded:', result.public_id, result.secure_url);

    // Using pg to bypass RLS
    const { Client } = require('pg');
    let dbUrl = process.env.DATABASE_URL;
    if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
      dbUrl = dbUrl.slice(1, -1);
    }
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    // Get project ID
    const projRes = await client.query('SELECT id FROM projects LIMIT 1');
    const projectId = projRes.rows[0].id;

    // Insert Root 1
    const rootRes = await client.query(
      'INSERT INTO knowledge_nodes (project_id, title, progress) VALUES ($1, $2, $3) RETURNING id',
      [projectId, 'Root 1', 0]
    );
    const rootId = rootRes.rows[0].id;

    // Insert Nhanh 1.1
    const mediaFiles = JSON.stringify([{
      url: result.secure_url,
      public_id: result.public_id,
      name: 'test.png',
      type: 'image/png'
    }]);
    
    await client.query(
      'INSERT INTO knowledge_nodes (project_id, parent_id, title, progress, media_files) VALUES ($1, $2, $3, $4, $5)',
      [projectId, rootId, 'Nhánh 1.1', 50, mediaFiles]
    );

    console.log('Inserted nodes to DB');
    await client.end();
  } catch (err) {
    console.error(err);
  }
}
run();
