# EPC-ETL Environment Documentation

## 🔑 SSH Access
- **User**: `root`
- **Host**: `116.203.91.44`
- **Default Path**: `/opt/epc-etl/scripts`

Example SSH command:
```bash
ssh root@<your-server-ip>
```

---

## 🗄️ PostgreSQL Setup
- **PostgreSQL Version**: 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
- **Default User**: `postgres`
- **Application User**: `epc_user`
- **Database**: `epcdb`
- **Connection String**:
  ```
     postgresql://epc_user:080godwin.com@localhost:5432/epcdb
  ```

### Paths
- **Scripts**: `/opt/epc-etl/scripts`
- **Logs**: `/opt/epc-etl/logs`


## ⚙️ Server Specs
- **Provider**: Hetzner (nbg1 datacenter)
- **Server ID**: cax41 (#107146547)
- **Plan**: `ubuntu-32gb-nbg1-1`
- **IP**: 116.203.91.44
- **Specs**:
  - **CPU**: 16 vCPUs (not 8)
  - **RAM**: 32 GB
  - **Disk**: 320GB SSD local
  - **OS**: Ubuntu 24.04 LTS

---

## 📊 Database Tables

## 📊 Database Performance
- **Total Database Size**: 51GB
- **certificates_stg**: ~28GB
- **recommendations_stg**: 21GB
- **Load Performance**: 108M records loaded in 3 minutes using parallel processing
- **Query Performance**: Sub-second responses with proper indexing

### `certificates_stg`
- **Row Count**: ~28,171,099
- **Unique Properties (lmk_key)**: ~28,171,099
- **Columns** (partial list):
  - `lmk_key` (text, PK candidate)
  - `postcode`
  - `current_energy_rating`
  - `potential_energy_rating`
  - `property_type`
  - `built_form`
  - `lodgement_date`
  - `inspection_date`
  - `main_fuel`
  - `mains_gas_flag`
  - `heating_cost_current`
  - `heating_cost_potential`
  - … (many more EPC attributes)

### `recommendations_stg`
- **Row Count**: ~108,038,801
- **Unique Properties (lmk_key)**: ~26,016,349
- **Columns**:
  - `lmk_key` (text, FK candidate to certificates)
  - `improvement_item` (integer)
  - `improvement_summary_text` (text)
  - `improvement_descr_text` (text)
  - `improvement_id` (numeric)
  - `improvement_id_text` (text)
  - `indicative_cost` (text)

### Other Tables
- `certificates` (production version of staging)
- `recommendations` (production version of staging)

## 📝 Data Quality Issues
- **main_fuel inconsistency**: 
  - `mains gas (not community)`: 16.2M properties (most common)
  - `Gas: mains gas`: 680K properties
  - `mains gas (community)`: 518K properties
- **Energy ratings**: Include some `INVALID!` values (121 records)
- **Coverage**: 26M properties have recommendations, 2.2M certificates-only

## 🔄 Key Scripts
- **Parallel Loading**: `/opt/epc-etl/scripts/parallel_load_recommendations_fixed.sh`
- **Index Creation**: `/opt/epc-etl/scripts/create_indexes.sh`
- **Log Location**: `/opt/epc-etl/logs/`

---

## 🛠️ Indexing Strategy
- **Primary Indexes**:
  - `certificates_stg(lmk_key)`
  - `recommendations_stg(lmk_key)`
- **Geographic**:
  - `certificates_stg(postcode)`
  - `certificates_stg(local_authority)`
- **Energy Ratings**:
  - `certificates_stg(current_energy_rating)`
  - `certificates_stg(potential_energy_rating)`
- **Property Type**:
  - `certificates_stg(property_type)`
  - `certificates_stg(built_form)`
- **Fuel/Heating**:
  - `certificates_stg(main_fuel)`
  - `certificates_stg(mains_gas_flag)`
- **Costs**:
  - `certificates_stg(heating_cost_current)`
  - `certificates_stg(heating_cost_potential)`
- **Improvements**:
  - `recommendations_stg(improvement_summary_text)`
  - `recommendations_stg(improvement_item)`
- **Dates**:
  - `certificates_stg(lodgement_date)`
  - `certificates_stg(inspection_date)`
- **Composite**:
  - `(current_energy_rating, postcode)`
  - `(main_fuel, current_energy_rating)`
- **Text Search**:
  - GIN index on `recommendations_stg(improvement_summary_text)`

---

## 📝 Notes
- Some indexes were left **INVALID** due to deadlocks during `CREATE INDEX CONCURRENTLY`.  
- Use `DROP INDEX CONCURRENTLY` to clean up invalid ones before recreating.  
- `tmux` is used to run long-running index creation scripts safely in the background.  
- Data quality issues:
  - `main_fuel` values are inconsistent (`mains gas (not community)`, `Gas: mains gas`, etc.).
  - `current_energy_rating` includes some `INVALID!` values.

---

## 🛠️ Planned Technology Stack
- **Backend**: Node.js/Express API on VPS
- **Frontend**: Next.js 14 App Router (Vercel)
- **Database**: PostgreSQL 15+ with pgai extension
- **AI/ML**: OpenAI Embeddings for property similarity
- **Caching**: Redis
- **Process Management**: tmux for long-running operations

## 🖥️ Process Management
- **Current tmux sessions**: Use `tmux list-sessions` to view active
- **Data loading**: Typically run in detached tmux sessions
- **Monitoring**: Multiple tmux windows for system monitoring during operations