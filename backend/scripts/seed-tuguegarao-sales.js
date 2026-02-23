const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

const SEED_TAG = 'seed_tuguegarao_sales_2025_08_10';

// Rows taken from user-provided Tuguegarao sales CSV-like data (Aug-Nov 2025)
const rows = [
  // AUGUST
  { date: '2025-08-27', dr_no: '21', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 125', color: 'BLACK', engine: '156FMI2S5106300', chassis: 'LX8PCJ500SE003800', total: 46000, last: 'BACCAY', first: 'JACINTO', middle: 'PANAGA', address: '188 BALZAIN TUGUEGARAO CITY', contact: '', sales_closer: 'CARLA' },
  { date: '2025-08-27', dr_no: '22', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJS1067235', chassis: 'LX8TDK8UXSB000176', total: 97000, last: 'OCAMPO', first: 'FRENZY KAYLE', middle: '', address: '67-E RIZAL ST. BAGUMBAYAN TUG, CITY', contact: '', sales_closer: 'DANG' },
  { date: '2025-08-29', dr_no: '23', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK', engine: '1P57MJS1121636', chassis: 'LX8TDK8G28B001025', total: 115000, last: 'RANJO', first: 'PRINCE CHARLIE', middle: 'DAYAG', address: 'MUNGO, TUAO CAGAYAN', contact: '9976304666', sales_closer: 'PRINCE' },

  // SEPTEMBER
  { date: '2025-09-02', dr_no: '31', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS112160', chassis: 'LX8TDK8G9SB001040', total: 115000, last: 'BALLAD', first: 'NOEL', middle: 'SORIANO', address: '15C LAAB ST. UGAC SUR TUGUEGARAO CITY', contact: '9978949447', sales_closer: 'CARLA' },
  { date: '2025-09-02', dr_no: '32', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1121641', chassis: 'LX8TDK8GXSB001029', total: 115000, last: 'BALLAD', first: 'DEXTER', middle: 'SORIANO', address: '111 CAMIA ST PANACAL VILLAGE TANZA', contact: '9675240050', sales_closer: 'CARLA' },
  { date: '2025-09-02', dr_no: '33', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1121609', chassis: 'LX8TDK8G1SB001033', total: 115000, last: 'CAMASIS', first: 'RYAN', middle: 'CASIA', address: '233 SORIANO ST. PALLUA SUR TUG, CITY', contact: '9564734895', sales_closer: 'CARLA' },
  { date: '2025-09-02', dr_no: '34', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1121639', chassis: 'LX8TDK8G8SB001028', total: 115000, last: 'MOLINA', first: 'HERSON', middle: 'ESCOBAR', address: '233 SORIANO ST. PALLUA SUR TUG, CITY', contact: '9495857619', sales_closer: 'CARLA' },
  { date: '2025-09-02', dr_no: '35', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE', engine: '1P57MJS1067193', chassis: 'LX8TDK8U7SB000149', total: 97000, last: 'ABANA', first: 'VALERIE', middle: 'COO', address: 'MALLO ST. LINAO EAST TUGUEGARAO CITY', contact: '9565616526', sales_closer: 'CARLA' },
  { date: '2025-09-05', dr_no: '43', source: 'AGENT', brand: 'MONARCH', model: 'OMNI 125', color: 'WHITE', engine: '1P52QMISTC00211', chassis: 'LWMTJY10ST000211', total: 72000, last: 'SAQUING', first: 'ROLANDO', middle: 'TAGUINOD', address: 'BRGY NATAPPIAN SOLANA CAGAYAN', contact: '9675364863', sales_closer: 'EFREN' },
  { date: '2025-09-05', dr_no: '41', source: 'WALK-IN', brand: 'MONARCH', model: 'OMNI 125', color: 'PEARL WHITE', engine: '156FMI2S5106347', chassis: 'LX8PCJ504SE003847', total: 72000, last: 'MIGUEL', first: 'MARLON', middle: 'CONCISO', address: 'STA. MARIA LALLO, CAGAYAN', contact: '906160795', sales_closer: 'EFREN' },
  { date: '2025-09-06', dr_no: '6', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158484', chassis: 'LX8PCL504NE012662', total: 50000, last: 'DE ASIS', first: 'HAROLD', middle: 'TABORETE', address: 'SAN GABRIEL TUGUEGARAO CITY CAGAYAN', contact: '9261993999', sales_closer: 'CARLA' },
  { date: '2025-09-11', dr_no: '5', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE/GOLD', engine: '1P57MJS1067183', chassis: 'LX8TDK8U9SB000138', total: 97000, last: 'TULIAO', first: 'EDMAR', middle: 'BAUET', address: '1085 SOLDIER HILLS CAGGAY TUGUEGARAO CITY', contact: '9367332777', sales_closer: 'CARLA' },
  { date: '2025-09-24', dr_no: '22', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 125', color: 'RED', engine: '156FMI255106221', chassis: 'LX8PCJ504SE003721', total: 46000, last: 'VALENCIA', first: 'VILMAR', middle: 'ROCERO', address: 'ARELLANO EXT UGAC SUR TUGUEGARAO CITY', contact: '9750816355', sales_closer: 'JUN' },
  { date: '2025-09-25', dr_no: '25', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2S5106350', chassis: 'LX8PCLJ504SE003850', total: 46000, last: 'CABILDO', first: 'MARLON', middle: 'GANNABAN', address: 'TALLANG, BAGGAO, CAG.', contact: '9075086947', sales_closer: 'JUN' },
  { date: '2025-09-25', dr_no: '27', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1226929', chassis: 'LX8TDK8G85B001367', total: 115000, last: 'SERRANO', first: 'JAY', middle: 'MALANA', address: 'LAPPAY ST. CATAGGAMAN NUEVO TUG CITY', contact: '', sales_closer: 'EFREN' },
  { date: '2025-09-25', dr_no: '28', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1226941', chassis: 'LX8TDK8GXSB001368', total: 115000, last: 'PAGADDU', first: 'SARRAH JANE', middle: 'BIRUNG', address: 'ANTONIO ST. CAGGAYN TUG, CITY', contact: '', sales_closer: 'CARLA' },
  { date: '2025-09-25', dr_no: '29', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE/GOLD', engine: '1P57MJR1343554', chassis: 'LX8TDK8UXRB001466', total: 97000, last: 'CABAN', first: 'RUBILYN', middle: 'CUSTODIO', address: 'ZONE-4 PROV. ROAD ANNAFUNAN EAST TUG, CITY', contact: '9911839274', sales_closer: 'CARLA' },
  { date: '2025-09-26', dr_no: '30', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1226935', chassis: 'LX8TDK8G3SB001390', total: 115000, last: 'BANIQUED', first: 'OLIVE', middle: 'CUSIPAG', address: 'ZONE 5 CARONAN ST. CARITAN NORTE TUGUEGARAO CITY', contact: '9627056987', sales_closer: 'CARLA' },
  { date: '2025-09-26', dr_no: '31', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1226947', chassis: 'LX8TDK8G65B001366', total: 115000, last: 'MAGGAY', first: 'VINCE MARK', middle: 'BANIQUED', address: 'CARITAN NORTE TUGUEGARAO CITY', contact: '9686203229', sales_closer: 'CARLA' },
  { date: '2025-09-26', dr_no: '37', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLUE', engine: '162FMKN5158564', chassis: 'LX8PCL506NEO12744', total: 50000, last: 'TABERDO', first: 'JASMIN', middle: 'PATINGGA', address: 'ZONE 7 MEMAN ST. ATULAYAN NORTE TUG, CITY', contact: '', sales_closer: 'EFREN' },
  { date: '2025-09-26', dr_no: '40', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKN5158790', chassis: 'LX8PCL502NEO12966', total: 50000, last: 'BALLAD', first: 'ESTRELLA', middle: 'SIBAL', address: 'ZONE 7 CARITAN NORTE TUGUEGARAO CITY', contact: '', sales_closer: 'EFREN' },
  { date: '2025-09-30', dr_no: '42', source: 'AGENT', brand: 'NONARCH', model: 'OMNI 125', color: 'PEARL WHITE', engine: '1P52QMISTC00223', chassis: 'LWMTJVIC9ST000223', total: 72000, last: 'MARIANO', first: 'JESTINE', middle: 'NARAG', address: 'CENTRO SOUTHEAST SOLANA, CAGAYAN', contact: '9055044911', sales_closer: 'EFREN' },
  { date: '2025-09-30', dr_no: '44', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106727', chassis: 'LX8PCL503SE007948', total: 50000, last: 'SIBUAGA', first: 'PASCUALA JANE', middle: 'TAMBIAO', address: 'ZONE 6 MARIBBAY ST. UGAC NORTE TUG, CITY', contact: '9657001893', sales_closer: 'JUN' },

  // OCTOBER (complete per provided list)
  { date: '2025-10-01', dr_no: '52', source: 'WALK-IN', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226934', chassis: 'LX8TDK8G7SB001389', total: 115000, last: 'BADAJOS', first: 'ANDRES', middle: 'MASIRAG', address: '245 TULIAO ST. CARITAN NORTE TUGUEGARAO CITY', contact: '9978815383', sales_closer: 'CARLA' },
  { date: '2025-10-04', dr_no: '64', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226938', chassis: 'LX8TDK8G5SB001360', total: 115000, last: 'CABARRUBIAS', first: 'PERFECTO', middle: 'VALDEZ', address: 'ZONE 3 KALAW ST. SAN GABRIEL TUG. CITY', contact: '9975891409', sales_closer: 'EFREN' },
  { date: '2025-10-06', dr_no: '67', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 125', color: 'RED', engine: '162FMKS5106721', chassis: 'LX8PCL502SE007942', total: 46000, last: 'TUMBALI', first: 'JEROME', middle: 'TASI', address: 'ZONE 4 CAMASI PENABLANCA CAGAYAN', contact: '9552772089', sales_closer: 'EFREN' },
  { date: '2025-10-08', dr_no: '73', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121604', chassis: 'LX8TDK8G1SB001002', total: 115000, last: 'FRIAS', first: 'BONNIE MARK', middle: 'PAGULAYAN', address: 'ALIMANAO PEÑABLANCA, CAGAYAN', contact: '9063466533', sales_closer: 'EFREN' },
  { date: '2025-10-12', dr_no: '158', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1227379', chassis: 'LX8TDK8G8SB001613', total: 115000, last: 'ANDALLO', first: 'RONA CARMINA', middle: 'COLETRABA', address: 'ZONE 01,MARACURU ENRILE CAGAYAN', contact: '9954620144', sales_closer: 'EFREN' },
  { date: '2025-10-12', dr_no: '159', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1227319', chassis: 'LX8TDK8G2SB001591', total: 115000, last: 'GUNDAN', first: 'ISABELO', middle: 'ENDANGAN', address: 'PUROK 05, ILLURU NORTE RIZAL CAGAYAN', contact: '9686454393', sales_closer: 'EFREN' },
  { date: '2025-10-13', dr_no: '78', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226924', chassis: 'LX8TDK8G3SB001356', total: 115000, last: 'SORIANO', first: 'ANGELINA', middle: 'QUILANG', address: 'ZONE 4 ANAFUNAN EAST TUGUE, CITY', contact: '9754936494', sales_closer: 'CARLA' },
  { date: '2025-10-13', dr_no: '85', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226931', chassis: 'LX8TDK8G1SB001386', total: 115000, last: 'ORPILLA', first: 'HARLEY JOHN', middle: 'LIMON', address: 'PHASE 2 NALON CAMELLA CARIG NORTE, TUG, CITY', contact: '9558190037', sales_closer: 'CARLA' },
  { date: '2025-10-13', dr_no: '86', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226940', chassis: 'LX8TDK8G9SB001362', total: 115000, last: 'MANCILLA JR.', first: 'FEDERICO', middle: 'SAN JUAN', address: '301 CARITAN NORTE TUGUEGARAO,CITY', contact: '9354300733', sales_closer: 'CARLA' },
  { date: '2025-10-13', dr_no: '89', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKS106723', chassis: 'LX8PCL506SE007944', total: 50000, last: 'AGABIN', first: 'FRANCISCA', middle: 'SAQUING', address: '33 ZONE 1 ATULAYAN NORTE TUGUEGARAO CITY', contact: '9559060033', sales_closer: 'JHUN' },
  { date: '2025-10-14', dr_no: '90', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKN5158804', chassis: 'LX8PCL506NE012985', total: 50000, last: 'MAGGAY', first: 'VILMER', middle: 'NARAG', address: 'ZONE 2 BRGY. GORAN AMULUNG EAST TUGUE, CITY', contact: '9657680722', sales_closer: 'CARLA' },
  { date: '2025-10-14', dr_no: '92', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226950', chassis: 'LX8TDK8G7SB001392', total: 115000, last: 'NITORADA', first: 'JUANITO', middle: 'PASAMONTE', address: 'ZONE 1 CARITAN NORTE TUGUEGARAO, CITY', contact: '91643378513', sales_closer: 'CARLA' },
  { date: '2025-10-16', dr_no: '430', source: 'AGENT', brand: 'MONARCH', model: 'OMNI 125', color: 'BLUE', engine: '156FMI2S5106361', chassis: 'LX8PCL509SE003861', total: 72000, last: 'VALES', first: 'EDDIELON', middle: 'LACAMBRA', address: 'BONIFACIO ST. CENRTO 1 BAGUMBAYAN TUGUE CITY', contact: '', sales_closer: 'CARLA' },
  { date: '2025-10-16', dr_no: '431', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226919', chassis: 'LX8TDK8G9SB001353', total: 115000, last: 'SORIANO', first: 'MA. CRISZELLE', middle: 'MANZANO', address: 'DIVERSION ROAD SAN GABRIEL, TUGUEGARAO CITY', contact: '', sales_closer: 'CARLA' },
  { date: '2025-10-20', dr_no: '479', source: 'AGENT', brand: 'MONARCH', model: 'OMNI 125', color: 'PEARL WHITE', engine: '1P52QMISTC00226', chassis: 'LWMTJVIC4ST000226', total: 72000, last: 'DICAN', first: 'CHRISTOPHER', middle: 'ABUYUAN', address: 'CENTRO 12 TUGUEGARAO CITY, CAGAYAN', contact: '', sales_closer: 'CARLA' },
  { date: '2025-10-22', dr_no: '99', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 125', color: 'RED', engine: '156FMI-2R5123746', chassis: 'LX8PCJ500RE011020', total: 46000, last: 'MANGLALLAN', first: 'VALENTINO', middle: 'RAMOS', address: 'ZONE 3 KALAW ST. SAN GABRIEL TUG. CITY', contact: '9554391475', sales_closer: 'EFREN' },
  { date: '2025-10-23', dr_no: '100', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1227315', chassis: 'LX8TDK8GSB001562', total: 115000, last: 'PALINGAYAN', first: 'JHAYMIL', middle: 'TOLEDO', address: 'ZONE 5 BRGY. GAMMAD IGUIG, CAGAYAN', contact: '9658699715', sales_closer: 'CARLA' },
  { date: '2025-10-25', dr_no: '113', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226942', chassis: 'LX8TDK8G0SB001363', total: 115000, last: 'PALATTAO', first: 'LANDER', middle: 'CULILI', address: 'BALUNCANAG RIZAL CAGAYAN', contact: '9493225292', sales_closer: 'JHUN' },
  { date: '2025-10-25', dr_no: '110', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACKGREEN', engine: '162FMKS5106934', chassis: 'LX8PCL506SE008155', total: 50000, last: 'ACILO', first: 'ORLY', middle: 'DEL ROSARIO', address: 'MELAD ST. CATAG. PARDO TUG. CITY', contact: '9554391475', sales_closer: 'EFREN' },
  { date: '2025-10-27', dr_no: '117', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226917', chassis: 'LX8TD8G4S8001351', total: 115000, last: 'CUSIPAG', first: 'JOSE', middle: 'BACCAY', address: 'ZONE 1 BUGATAY PENBALANCA CAGAYAN', contact: '9651407776', sales_closer: 'EFREN' },
  { date: '2025-10-27', dr_no: '121', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/BROWN', engine: '1P57MJS12297327', chassis: 'LX8TDK8G3XB00156', total: 115000, last: 'BATANG', first: 'JOSHUA', middle: 'MALANA', address: '39 PROV ROAD PALLUA SUR TUGUEGARAO CITY', contact: '', sales_closer: 'EFREN' },
  { date: '2025-10-27', dr_no: '119', source: 'AGENT', brand: 'MONARCH', model: 'OMNI 125', color: 'GRAY', engine: '1P52QMISTC00248', chassis: 'LWMTJV103ST000248', total: 72000, last: 'PADILLA', first: 'RAFFY', middle: 'CASIBANG', address: 'ZONE 3 CALUBAQUIB ST. PALLUA SUR TUGUE. CITY', contact: '', sales_closer: 'EFREN' },
  { date: '2025-10-30', dr_no: '', source: 'AGENT', category: 'INHOUSE', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226946', chassis: 'LX8TDK8G4SB001365', total: 115000, last: 'GREGORIO', first: 'HENSON', middle: 'CAPAL', address: '', contact: '', sales_closer: 'EFREN' }
  ,
  // NOVEMBER
  { date: '2025-11-03', dr_no: '133', source: 'AGENT', brand: 'MONARCH', model: 'MONARCH 150', color: 'RED', engine: '161FMJS5105822', chassis: 'LX8PCK500SE011692', total: 48000, last: 'MABUGAY', first: 'DANILO JR', middle: 'UANANG', address: 'ZONE 01, MABINI BAGGAO CAGAYAN', contact: '9535203096', sales_closer: 'EFREN' },
  { date: '2025-11-03', dr_no: '135', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJS1067169', chassis: 'LX8TDK8U4SB000111', total: 97000, last: 'DICAN', first: 'LEO MARK', middle: 'GARCIA', address: 'ZONE 06,1084 SOLDIERS HILL CAGGAY TUG. CITY', contact: '9493685267', sales_closer: 'CARLA' },
  { date: '2025-11-03', dr_no: '136', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE', engine: '1P57MJS1067158', chassis: 'LX8TDK8U1SB000096', total: 97000, last: 'BICCAN', first: 'ALBERT', middle: 'CUARTEROS', address: 'CARIG NORTE TUGUEGARAO CITY', contact: '9670754774', sales_closer: 'CARLA' },
  { date: '2025-11-05', dr_no: '140', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJS1067163', chassis: 'LX8TDK8U2SB000107', total: 97000, last: 'GUZMAN', first: 'GERALD', middle: 'FUENTES', address: 'CARITAN NORTE TUGUEGARAO CITY', contact: '9128677427', sales_closer: 'CARLA' },
  { date: '2025-11-05', dr_no: '142', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1227306', chassis: 'LX8TDK8G9SB001555', total: 115000, last: 'BALMATERO', first: 'MARYJANE', middle: 'SOTTO', address: 'ZONE 02, 66 MALLILLIN ST. PALLUA SUR TUG. CITY', contact: '9531129866', sales_closer: 'CARLA' },
  { date: '2025-11-06', dr_no: '144', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE', engine: '1P57MJS1067142', chassis: 'LX8TDK8U7SB00085', total: 97000, last: 'TAGUIAM', first: 'JOYCE', middle: 'ALAN', address: '54 PRO.ZONE 1 LINAO EAST TUGUEGARAO CITY', contact: '9535747117', sales_closer: 'CARLA' },
  { date: '2025-11-07', dr_no: '147', source: 'AGENT', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P557MJS1227380', chassis: 'LX8TDK8GXSB001614', total: 115000, last: 'SIMANGAN', first: 'DOMINGO', middle: 'MALENAB', address: 'ZONE 1 LEDESMA ST. NATAPPIAN WEST SOLANA', contact: '', sales_closer: 'CARLA' },
  { date: '2025-11-10', dr_no: '155', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJS1067162', chassis: 'LX8TDK8U0SB000106', total: 97000, last: 'AGUSTIN', first: 'ANALYN', middle: 'CUSIPAG', address: 'ZONE 06,MAGORA ST. ANNAFUNAN EAST TUG. CITY', contact: '9753282822', sales_closer: 'CARLA' },
  { date: '2025-11-10', dr_no: '156', source: 'AGENT', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE', engine: '1P57MJS1067132', chassis: 'LX8TDK8U6B000076', total: 97000, last: 'MACARUBBO', first: 'MARK PAUL', middle: 'TUMANGUIL', address: '93-A CAMPOS ST. CARITAN CENTRO, TUG. CITY', contact: '9156070992', sales_closer: 'CARLA' }
];

async function findBranch() {
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Tuguegarao', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Tuguegarao" not found in branches table.');
  return b;
}

function normalizeModel(s) { return utils.normalizeSkygoModel(s); }

async function seed() {
  const branch = await findBranch();
  console.log('Seeding sales for branch:', branch.name, 'id=', branch.id);

  const created = [];
  const skipped = [];
  for (const r of rows) {
    try {
      const dateSold = r.date ? new Date(r.date) : new Date();

      // Idempotency: allow duplicate DR; skip only if engine/chassis unit already sold
      const engKey = (r.engine || '').trim();
      const chsKey = (r.chassis || '').trim();
      if (engKey || chsKey) {
        const alreadySold = await utils.isVehicleAlreadySold(prisma, engKey, chsKey);
        if (alreadySold) {
          console.log('Skip existing sale for unit', engKey || chsKey, '(already sold)');
          skipped.push(engKey || chsKey);
          continue;
        }
      }

      const modelNorm = normalizeModel(r.model || '');
      const item = await utils.findSkygoItemForModel(prisma, modelNorm);
      if (!item) { console.warn('SKIP: SKYGO item not found for model', r.model, 'dr_no', r.dr_no); continue; }
      let vehicle = await utils.findAvailableVehicleForBranchAndItem(prisma, branch.id, item.id, r.engine, r.chassis);
      if (!vehicle) {
        vehicle = await utils.ensureInventoryUnitForSale(prisma, branch.id, item, r, dateSold);
        if (!vehicle) { console.warn('SKIP: No available unit (and could not auto-add) for', r.engine || r.chassis, 'model', item.model, 'dr_no', r.dr_no); continue; }
      }

      const totalAmount = r.total != null ? Number(r.total) : 0;
      const category = r.category || 'Financing';

      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.sales.create({
          data: {
            branch_id: branch.id,
            date_sold: dateSold,
            dr_no: r.dr_no || null,
            si_no: r.dr_no || null,
            total_amount: totalAmount,
            payment_method: category,
            category_of_sales: category,
            source_of_sales: r.source || null,
            last_name: r.last || '',
            first_name: r.first || '',
            middle_name: r.middle || null,
            address: r.address || null,
            contact_no: r.contact || null,
            agent: r.sales_closer || null,
            fmo: SEED_TAG
          }
        });

        await tx.vehicle_units.update({ where: { id: vehicle.id }, data: { status: 'sold' } });
        await tx.inventory_movements.update({ where: { id: vehicle.inventory_id }, data: { sold_qty: { increment: 1 }, ending_qty: { decrement: 1 } } });
        await tx.sales_items.create({ data: { sale_id: sale.id, item_id: item.id, qty: 1, unit_price: totalAmount || 0, amount: totalAmount || 0, vehicle_unit_id: vehicle.id } });
        await tx.sales_inventory.create({ data: { sale_id: sale.id, inventory_id: vehicle.inventory_id, qty: 1 } });

        return sale;
      });

      created.push(result.id);
      console.log('Created sale id', result.id, 'dr_no', r.dr_no || null);
    } catch (err) {
      console.error('Failed to insert sale for dr_no', r.dr_no, err.message || err);
    }
  }

  console.log('\nSeeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
