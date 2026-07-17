CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CSR Coordinator', 'Workshop Technician', 'Sustainability Manager', 'Admin')),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    partner VARCHAR(255) NOT NULL, -- e.g., ChildFund, Britam
    county VARCHAR(100) NOT NULL,  -- e.g., Narok
    branch VARCHAR(100) NOT NULL,  -- e.g., Nairobi, Kisumu
    assigned_engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Screening' CHECK (status IN ('Screening', 'Matching', 'Technical Review', 'CSR Approval', 'Workshop Processing', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    original_total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    excel_file_url TEXT NOT NULL, -- Link to Supabase Storage Bucket file path
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    original_raw_text TEXT NOT NULL, -- e.g., "DAYLIFF SUNVERTER B.3 7KW SOLAR INVERTER"
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    -- Automatic Product Intelligence Parsing Fields
    product_segment VARCHAR(100) CHECK (product_segment IN ('Solar Modules', 'Solar Inverters', 'Pumps', 'Motors', 'Tanks', 'Pipes & Fittings', 'Accessories')),
    brand VARCHAR(100) DEFAULT 'Dayliff',
    product_family VARCHAR(100),    -- e.g., Sunverter, Submersible
    series_model VARCHAR(100),      -- e.g., B.3, DS
    
    -- Level 1 Engineering Evaluation Fields
    power_rating_kw NUMERIC(8, 2),  -- e.g., 7.00
    voltage VARCHAR(50),            -- e.g., 240V, 415V
    
    -- Level 2 Advanced Pump Engineering Metrics
    flow_rate_q NUMERIC(8, 2),      -- Expected Flow in m³/h
    dynamic_head_tdh NUMERIC(8, 2), -- Total Dynamic Head in meters
    phase VARCHAR(20) CHECK (phase IN ('Single Phase', 'Three Phase', 'DC')),
    
    status VARCHAR(50) DEFAULT 'Unmatched' CHECK (status IN ('Unmatched', 'Pending Match', 'Partially Matched', 'Fully Matched', 'Approved substitute')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    netstock_code VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    branch_location VARCHAR(100) NOT NULL DEFAULT 'Nairobi',
    
    -- Structured Filtering Fields for the Matching Engine
    product_segment VARCHAR(100) CHECK (product_segment IN ('Solar Modules', 'Solar Inverters', 'Pumps', 'Motors', 'Tanks', 'Pipes & Fittings', 'Accessories')),
    power_rating_kw NUMERIC(8, 2),
    voltage VARCHAR(50),
    flow_rate_q NUMERIC(8, 2),
    dynamic_head_tdh NUMERIC(8, 2),
    phase VARCHAR(20),
    
    condition_status VARCHAR(50) DEFAULT 'Available' CHECK (condition_status IN ('Available', 'Reserved', 'In Workshop', 'Scrapped')),
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

