const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createTableAndRPC() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    // Create table knowledge_nodes
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS knowledge_nodes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          parent_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          progress SMALLINT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
          media_files JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await client.query(createTableQuery);
    console.log("Table knowledge_nodes created or already exists.");

    // Create Index
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent_id ON knowledge_nodes(parent_id);
    `;
    await client.query(createIndexQuery);
    console.log("Index idx_knowledge_nodes_parent_id created or already exists.");

    // Create RPC function get_all_descendants
    const createRpcQuery = `
      CREATE OR REPLACE FUNCTION get_all_descendants(root_id UUID)
      RETURNS TABLE (
        id UUID,
        media_files JSONB
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        WITH RECURSIVE descendants AS (
          SELECT kn.id, kn.media_files
          FROM knowledge_nodes kn
          WHERE kn.id = root_id
      
          UNION ALL
      
          SELECT kn.id, kn.media_files
          FROM knowledge_nodes kn
          INNER JOIN descendants d ON kn.parent_id = d.id
        )
        SELECT d.id, d.media_files FROM descendants d;
      END;
      $$;
    `;
    await client.query(createRpcQuery);
    console.log("RPC function get_all_descendants created or updated.");

  } catch (error) {
    console.error("Error creating database schema:", error);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

createTableAndRPC();
