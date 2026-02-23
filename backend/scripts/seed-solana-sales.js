const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEED_TAG = 'seed_solana_sales_2025_08_16';

function normalizeModel(s) {
  if (!s) return '';
  return s.replace(/\s+/g, ' ').trim();
}

function modelSearchTerms(model) {
  const terms = [];
  const m = normalizeModel(model || '');
  if (m) terms.push(m);
  if (/^monarch\s*175$/i.test(m)) terms.push('TM175');
  if (/^monarch\s*125$/i.test(m)) terms.push('TM125');
  if (/^p1\s*bolt\s*150$/i.test(m)) terms.push('BOLT 150');
  if (/^m1\s*lance\s*150$/i.test(m)) terms.push('LANCE 150');
  if (/^omni\s*125$/i.test(m)) terms.push('VM125', 'WM125');
  return Array.from(new Set(terms));
}

async function findBranch() {
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Solana', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Solana" not found in branches table.');
  return b;
}

const rows = [
  // AUGUST (10 sales = 966,000)
  { date: '8/16/2025', dr_no: '0002', brand: 'SKYGO', model: 'MONARCH 175', color: 'BLACK GREEN', engine: '162FMKN5158470', chassis: 'LX8PCL501NF012652', total: 50000, last: 'DAYAG', first: 'ROMEO', middle: 'C.', address: 'P/2 BALI WEST SOLANA CAGAYAN', contact: '', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '8/16/2025', dr_no: '5', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MU51120591', chassis: 'LX8TDK8G95B000857', total: 115000, last: 'GALIZA', first: 'NOEL', middle: 'PARALLAG', address: 'P3 SAN LUIS TUAO CAGAYAN', contact: '9947464934', sales_closer: 'RAYMUND SIBBALUCA', source: 'WALK-IN' },
  { date: '8/19/2025', dr_no: '7', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MJS1120536', chassis: 'LX8TDK86XSB00080', total: 115000, last: 'CHAVEZ', first: 'MARIA LUIS', middle: '', address: 'MABINI ST CENTRO SOUTH WEST SOLANA CAGAYAN', contact: '', sales_closer: 'RAYNUND SIBBALUCA', source: 'AGENT' },
  { date: '8/26/2025', dr_no: '20', brand: 'SKYGO', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158477', chassis: 'LX8PCL50XNE012648', total: 50000, last: 'BAQUIRAN JR', first: 'GORIO', middle: 'MABBORANG', address: 'BASI EAST SOLANA', contact: '9365786150', sales_closer: 'DANNY BOY DAYAG', source: 'WALK-IN' },
  { date: '8/22/2025', dr_no: '16', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJS1067233', chassis: 'LX8TDK8U6SB000174', total: 97000, last: 'REDULLA', first: 'JUSTIN', middle: 'GUITTU', address: 'ANDRAYAN NORTH', contact: '9674921747', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '8/22/2025', dr_no: '18', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE', engine: '1P57MJS1067211', chassis: 'LX8TDK8UXSB000145', total: 97000, last: 'MANABAT', first: 'JOJO', middle: 'TAGARAO', address: 'BASI WEST SOLANA CAGAYAN', contact: '9675906206', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '8/22/2025', dr_no: '14', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE', engine: '1P57MJS1067212', chassis: 'LX8TDK8U1SB000146', total: 97000, last: 'PASCUAL', first: 'SANTIAGO', middle: 'AVILA', address: 'CATTARAN SOLANA', contact: '97550953791', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '8/27/2025', dr_no: '23', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121612', chassis: 'LX8TDK8G7SB001036', total: 115000, last: 'ALBUERO', first: 'JOVINAL', middle: 'MADDELA', address: 'LANNA SOLANA', contact: '9150943252', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '8/22/2025', dr_no: '17', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121625', chassis: 'LX8TDK8G65B001013', total: 115000, last: 'CARANGUIAN', first: 'RYAN', middle: 'MABBORANG', address: 'CATTARAN SOLANA', contact: '9260864507', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '8/19/2025', dr_no: '', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK SILVER', engine: '1P57MJS1121642', chassis: 'LX8TDK8G6SB001030', total: 115000, last: 'DAYAG', first: 'DANNY BOY', middle: 'C.', address: 'BASI WEST SOLANA CAGAYAN', contact: '9658254146', sales_closer: '', source: 'WALK-IN' },

  // SEPTEMBER (14 sales = 1,024,000)
  { date: '09/02/2025', dr_no: '29', brand: 'SKYGO', model: 'MONARCH 175', color: 'BLACK', engine: '1P5MJS1067202', chassis: 'LX8TDK8U4SB000187', total: 50000, last: 'BATULAN', first: 'MARK PAUL', middle: 'ESPIRITU', address: 'SANTA ROSA IGUIG CAGAYAN', contact: '99771421121', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '09/02/2025', dr_no: '30', brand: 'SKYGO', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158469', chassis: 'LX8PCL501NE012649', total: 50000, last: 'AGUSTIN', first: 'JERRY', middle: 'TURARAY', address: 'NAMABBALAN TUG.CITY', contact: '', sales_closer: 'DANNY BOY DAYAG', source: 'WALK-IN' },
  { date: '09/06/2025', dr_no: '38', brand: 'SKYGO', model: 'MONARCH 175', color: 'RED', engine: '162FMKN5158803', chassis: 'LX8PCL505NE012976', total: 50000, last: 'PADDANAN', first: 'MARISOL', middle: 'SIBAYAN', address: 'TUAO EAST SOLANA CAGAYAN', contact: '', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '09/06/2025', dr_no: '39', brand: 'SKYGO', model: 'MONARCH 125', color: 'RED', engine: '156FMI2R5123741', chassis: 'LX8PCJ507RE011015', total: 46000, last: 'MALAZZAB', first: 'NORIEL', middle: 'JOSE', address: 'NANGALASUAN AMULUNG WEST', contact: '9532834814', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '09/06/2025', dr_no: '40', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJS1067204', chassis: 'LX8TDK8U6SB000188', total: 97000, last: 'TALOSIG', first: 'JOSEPH', middle: 'CALLUENG', address: 'PUROK 4 BAGUMBAYAN BASI WEST SOLANA', contact: '', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '09/11/2025', dr_no: '5', brand: 'SKYGO', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106708', chassis: 'LX8PCL50XSE007929', total: 50000, last: 'TANGAN', first: 'MARIO', middle: 'DAYAG', address: 'PUROK 2 BANGAG SOLANA CAGAYAN', contact: '9752391642', sales_closer: 'DANNY BOY DAYAG', source: 'WALK-IN' },
  { date: '09/16/25', dr_no: '7', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MUS1121618', chassis: 'LX8TDK8G4SB001009', total: 115000, last: 'SIMANGAN', first: 'ROGELIO', middle: 'BALAUITAN', address: 'MALAPACAYU PUROK 6 LANNIG SOLANA CAGAYAN', contact: '9059306253', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '09/16/25', dr_no: '9', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'SILVER/GOLD', engine: '1P57MJR1343565', chassis: 'LX8TDKU5RB001472', total: 97000, last: 'LACERNA', first: 'ANTONINO', middle: 'DE ASIS', address: 'PUROK 3 ARELLANO ST.SOLANA CAGAYAN', contact: '9532761658', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '09/16/25', dr_no: '8', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJ51121607', chassis: 'LX8TDK8G7SB001005', total: 115000, last: 'TENERIFE', first: 'IAN', middle: 'LARROSA', address: 'CENTRO II  PUROK 2 TUAO CAGAYAN', contact: '9918935434', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '09/20/25', dr_no: '17', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1121652', chassis: 'LX8TDK8G3SBDD1048', total: 115000, last: 'BANGAYAN', first: 'JOMAR', middle: 'BINAYUG', address: 'PUROK 2 CATTARAN SOLANA CAGAYAN', contact: '9276913452', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '09/20/25', dr_no: '18', brand: 'SKYGO', model: 'MONARCH 175', color: 'RED', engine: '162FMKS50733', chassis: 'LX8PCL509SEOO7954', total: 50000, last: 'ANRADA', first: 'ARNALDO', middle: 'VILLAFUERTE', address: 'BASI WEST PUROK 01 SOLANA CAGAYAN', contact: '9978055786', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '09/20/25', dr_no: '19', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE/GOLD', engine: '1P57MJR1297947', chassis: 'LX8TDK8U3RB001065', total: 97000, last: 'MATALANG', first: 'JAYPEE', middle: 'CENABRE', address: 'PUROK 3 CAGUMITAN TUAO CAGAYAN', contact: '9542347921', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '09/27/25', dr_no: '32', brand: 'SKYGO', model: 'MONARCH 125', color: 'BLACK', engine: '156FMI2R5122408', chassis: 'LX8PCJ506REOU9062', total: 46000, last: 'SAQUING', first: 'RUFINO', middle: 'TAGUINOD', address: 'PUROK 3 NATAPPIAN EAST SOLANA', contact: '', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '09/27/25', dr_no: '34', brand: 'SKYGO', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI12S5106341', chassis: 'LX8PCJ503SE00384', total: 46000, last: 'LIMBAUAN', first: 'RITSMOND', middle: 'TRABOCO', address: 'Z-3 CABAYO SANTO NINO FAIRE CAGAYAN', contact: '', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },

  // OCTOBER (26 sales = 2,044,000)
  { date: '10/01/2025', dr_no: '52', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P67MJS1226926', chassis: 'LX8TDK8G5SB001357', total: 115000, last: 'SIBBALUCA', first: 'RAYMUND', middle: 'CALIMAG', address: 'MANGA PEÑABLANCA CAGAYAN', contact: '96226583350', sales_closer: 'RAYMUND SIBBALUCA', source: 'WALK-IN' },
  { date: '10/04/2025', dr_no: '57', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '157MJSS1226949', chassis: 'LX8TDK8G1SB001372', total: 115000, last: 'PACIS', first: 'MARIFEL', middle: 'PACIS', address: 'CENTRO II PUROK 2 TUAO CAGAYAN', contact: '9366321484', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '10/04/2025', dr_no: '62', brand: 'SKYGO', model: 'OMNI 125', color: 'WHITE', engine: '1P52QMISTC00222', chassis: 'LWTJV1C7ST000222', total: 72000, last: 'TAMAYO', first: 'BOB JHON', middle: 'GARCIA', address: 'CENTRO 11 BALZAIN EAST TUG.CAGAYAN', contact: '9662252719', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '10/04/2025', dr_no: '63', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE', engine: '1P57MJR1297888', chassis: 'LX8TDK8U8RB001014', total: 97000, last: 'LIMLENGCO', first: 'JEDERIZA', middle: 'NICOMEDES', address: 'CENTRO 11 BALZAIN EAST TUG.CAGAYAN', contact: '9533391204', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '10/06/2025', dr_no: '58', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1226944', chassis: 'LX8TDK8G8SB001370', total: 115000, last: 'MANEJA', first: 'JAIME', middle: 'RAMIREZ', address: 'ZONE 7 LINGU SOLANA CAGAYAN', contact: '9688680651', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/05/2025', dr_no: '68', brand: 'SKYGO', model: 'MONARCH 125', color: 'RED', engine: '156FM12S5106242', chassis: 'LX8PCJ501SE00374', total: 46000, last: 'TACUBOY', first: 'MARK JAMES', middle: 'GUITTU', address: 'CUSIPAG STREET ANDRAYAN NORTH SOLANA CAGAYAN', contact: '9911993276', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/08/2025', dr_no: '59', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1226951', chassis: 'LX8TDKG3SB001373', total: 115000, last: 'DELA CRUZ', first: 'MARIO', middle: 'SACRAMENTO', address: 'Z7 PACAC PEQUEÑO AMULUNG CAGAYAN', contact: '9755437559', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/08/2025', dr_no: '71', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1226936', chassis: 'LX8TDK8G5SB001391', total: 115000, last: 'ESCOBAR', first: 'CHRISTINE JOY', middle: 'ESCOBAR', address: 'LANZONES STREET TUGUEGARAO CITY CAGAYAN', contact: '9561659465', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/09/2025', dr_no: '72', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1226948', chassis: 'LX8TDK8GXSB001371', total: 115000, last: 'AGUSTIN', first: 'JULIUS', middle: '', address: 'ZONE 5 BAUAN EAST SOLANA CAGAYAN', contact: '9758159675', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/13/2025', dr_no: '79', brand: 'SKYGO', model: 'MONARCH 125', color: 'RED', engine: '156FMI2S5106241', chassis: 'LX8PCJ50XSE003741', total: 46000, last: 'TULUGAN', first: 'DANTE', middle: 'TULUGAN', address: 'PUROK 4 SAN LUIS TUAO CAGAYAN', contact: '9702036484', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/13/2025', dr_no: '83', brand: 'SKYGO', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2S5106340', chassis: 'LX8PCJ501SE003840', total: 46000, last: 'MABBORANG', first: 'DIANA', middle: 'DARONI', address: 'PUROK 7 BULAUITAN ST.BASI EAST SOLANA CAGAYAN', contact: '9168954293', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/13/2025', dr_no: '80', brand: 'SKYGO', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106717', chassis: 'LX8PCL500SE007938', total: 50000, last: 'CAUILAN', first: 'ROLAND', middle: 'GALLEBO', address: 'ZONE 6 MALALAM MALACABIBI SOLANA CAG.', contact: '9362940827', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/13/2025', dr_no: '81', brand: 'SKYGO', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2S106372', chassis: 'LX8PCJ503SE003872', total: 46000, last: 'CAUILAN', first: 'ROLLY', middle: 'GALLETES', address: 'ZONE 6 MALALAM MALACABIBI SOLANA CAG.', contact: '95345572628', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/13/2025', dr_no: '82', brand: 'SKYGO', model: 'MONARCH 125', color: 'RED', engine: '156FMI2S5106245', chassis: 'LX8PCJ507SE003745', total: 46000, last: 'LASAM', first: 'LEONARDO', middle: 'MABBORANG', address: 'ZONE 3 PADUL SOLANA CAGAYAN', contact: '9852992960', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/18/2025', dr_no: '35', brand: 'SKYGO', model: 'MONARCH 125', color: 'RED', engine: '156FMI2R5123780', chassis: 'LX8PCJ506RE011054', total: 46000, last: 'ABANIA', first: 'KRISTINA', middle: 'PAGULAYAN', address: 'PUROK 4 CENTRO NORTH WEST SOLANA CAGAYAN', contact: '98121935353', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/18/2025', dr_no: '38', brand: 'SKYGO', model: 'MONARCH 125', color: 'BLUE', engine: '162FMKS5106820', chassis: 'LX8PCL502SE008041', total: 46000, last: 'DUMLAO', first: 'MARK THERENCE', middle: 'DAYAG', address: 'PUROK 1 BAUAN EAST SOLANA CAGAYAN', contact: '9653956955', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/18/2025', dr_no: '37', brand: 'SKYGO', model: 'MONARCH 125', color: 'RED', engine: '162FMKS5106713', chassis: 'LX8PCL503SE007934', total: 46000, last: 'PASINOS', first: 'REYNALD', middle: 'LAPPAY', address: 'COMERCIO ST. CENTRO SOLANA CAGAYAN', contact: '9167240625', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/18/2025', dr_no: '36', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BROWN', engine: '1P57MJS1227298', chassis: 'LX8TDK85SB001567', total: 115000, last: 'TARUN', first: 'ANTONIO', middle: 'VALENTIN', address: 'BAUAN EAST SOLANA CAGAYAN', contact: '9942516230', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/24/2025', dr_no: '11649', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BROWN', engine: '1P57MJS1227292', chassis: 'LX8TDK8G7SB001599', total: 115000, last: 'MARCELO', first: 'ELISON', middle: 'DOCA', address: 'MAGUIRIG SOLANA CAGAYAN', contact: '9753789904', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/24/2025', dr_no: '105', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BROWN', engine: '1P57MJS1226953', chassis: 'LX8TDK8G0SB001587', total: 115000, last: 'MALSI JR.', first: 'ROSMEL', middle: 'PAGULAYAN', address: 'PUROK 1 BASI WEST SOLANA CAGAYAN', contact: '', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/24/2025', dr_no: '106', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK', engine: '1P57MJS1226954', chassis: 'LX8TDK8G9SB001393', total: 115000, last: 'BALUBAL', first: 'ANDRES', middle: 'PAMITTAN', address: 'PUROK 4 BASI WEST SOLANA CAGAYAN', contact: '9352469693', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/24/2025', dr_no: '108', brand: 'SKYGO', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2S55106339', chassis: 'LX8PCJ505SE003839', total: 46000, last: 'MARUPA', first: 'RICHARD', middle: 'TABBU', address: 'ZONE 3 NATAPPIAN EAST SOLANA GAGAYAN', contact: '9554025479', sales_closer: 'RAYMUND SIBBALUCA', source: 'WALK-IN' },
  { date: '10/24/2025', dr_no: '107', brand: 'SKYGO', model: 'MONARCH 125', color: 'RED', engine: '162FMKS5106902', chassis: 'LX8PCL504SE00123', total: 46000, last: 'CASTAÑEDA', first: 'ROMEL', middle: 'PARALLAG', address: 'ZONE 3 PADUL SOLANA CAGAYAN', contact: '9754353069', sales_closer: 'RAYMUND SIBBALUCA', source: 'AGENT' },
  { date: '10/28/2025', dr_no: '123', brand: 'SKYGO', model: 'MONARCH 175', color: 'BLUE', engine: '162FMK85106920', chassis: 'LX8PCL506SE008141', total: 50000, last: 'ORPILLA', first: 'EDISON', middle: 'ARELA', address: 'ZONE 3 NATAPPIAN EAST SOLANA GAGAYAN', contact: '9539936161', sales_closer: 'DANNY BOY DAYAG', source: 'AGENT' },
  { date: '10/28/2025', dr_no: '122', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'SILVER/BLACK', engine: '1P57MJS1227320', chassis: 'LX8TDK8G4SB001592', total: 115000, last: 'TALIPING', first: 'NICA', middle: 'AGTARAP', address: 'PUROK 3 MUNGO TUAO CAGAYAN', contact: '', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
  { date: '10/30/2025', dr_no: '129', brand: 'SKYGO', model: 'MONARCH 175', color: 'BLUE', engine: '162FMKS5106988', chassis: 'LX8PCL503SE008209', total: 50000, last: 'ABONG', first: 'MARY ANN', middle: 'CAGURUNGAN', address: 'PUROK 3 ANDRAYAN NORTH SOLANA CAGAYAN', contact: '9675267436', sales_closer: 'PRINCE CHARLIE RANJO', source: 'AGENT' },
];

function parseDate(s) {
  if (!s) return null;
  let cleaned = s.replace(/\s+/g, '').replace(/\//g, '/');
  cleaned = cleaned.replace(/2005$/, '2025');
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const m = parseInt(parts[0], 10);
    const d = parseInt(parts[1], 10);
    let y = parseInt(parts[2], 10);
    if (y < 100) y += 2000;
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000) {
      // Return Date object for Prisma
      return new Date(y, m - 1, d);
    }
  }
  throw new Error('Invalid date format: ' + s);
}

async function seed() {
  const branch = await findBranch();
  console.log('Seeding sales for branch:', branch.name, 'id=', branch.id);

  const created = [];
  const skipped = [];

  for (const r of rows) {
    try {
      const dateSold = parseDate(r.date);
      const totalAmount = r.total || 0;
      const modelTerms = modelSearchTerms(r.model);
      if (modelTerms.length === 0) throw new Error('No model terms for: ' + r.model);

      const item = await prisma.items.findFirst({
        where: { AND: [{ brand: { contains: r.brand || '', mode: 'insensitive' } }, { OR: modelTerms.map((t) => ({ model: { contains: t, mode: 'insensitive' } })) }] },
      });
      if (!item) throw new Error(`No item for brand="${r.brand}" model="${r.model}"`);

      // Find all inventory movements for this item at this branch
      const invMovements = await prisma.inventory_movements.findMany({
        where: { branch_id: branch.id, item_id: item.id },
        orderBy: { date_received: 'desc' },
      });
      if (invMovements.length === 0) throw new Error(`No inventory for item "${item.model}" at branch "${branch.name}"`);

      // Try to find vehicle matching engine or chassis across all inventory movements
      let vehicle = null;
      const eng = (r.engine || '').trim();
      const chs = (r.chassis || '').trim();
      
      // First try: exact engine match
      if (eng) {
        for (const inv of invMovements) {
          vehicle = await prisma.vehicle_units.findFirst({
            where: { inventory_id: inv.id, status: 'available', engine_no: eng },
          });
          if (vehicle) break;
        }
      }
      
      // Second try: exact chassis match
      if (!vehicle && chs) {
        for (const inv of invMovements) {
          vehicle = await prisma.vehicle_units.findFirst({
            where: { inventory_id: inv.id, status: 'available', chassis_no: chs },
          });
          if (vehicle) break;
        }
      }
      
      // Third try: any available vehicle for this item
      if (!vehicle) {
        for (const inv of invMovements) {
          vehicle = await prisma.vehicle_units.findFirst({
            where: { inventory_id: inv.id, status: 'available' },
          });
          if (vehicle) break;
        }
      }
      
      if (!vehicle) {
        console.warn(`SKIP: No available vehicle for engine="${eng}" chassis="${chs}" model="${item.model}" dr_no="${r.dr_no}"`);
        skipped.push(r.dr_no || 'unknown');
        continue;
      }

      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.sales.create({
          data: {
            branch_id: branch.id,
            date_sold: dateSold,
            dr_no: r.dr_no || null,
            si_no: r.dr_no || null,
            total_amount: totalAmount,
            payment_method: 'Financing',
            category_of_sales: 'Financing',
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
