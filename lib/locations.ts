export interface MalaysianLocation {
  label: string;
  state: string;
  lat: number;
  lon: number;
}

export const MALAYSIAN_LOCATIONS: MalaysianLocation[] = [
  // Peninsular — Federal & Major Cities
  { label: "Kuala Lumpur",       state: "W.P. Kuala Lumpur",  lat: 3.1390,  lon: 101.6869 },
  { label: "Putrajaya",          state: "W.P. Putrajaya",     lat: 2.9264,  lon: 101.6964 },
  { label: "Cyberjaya",          state: "Selangor",            lat: 2.9213,  lon: 101.6559 },
  { label: "Shah Alam",          state: "Selangor",            lat: 3.0733,  lon: 101.5185 },
  { label: "Petaling Jaya",      state: "Selangor",            lat: 3.1073,  lon: 101.6067 },
  { label: "Klang",              state: "Selangor",            lat: 3.0449,  lon: 101.4452 },
  { label: "Subang Jaya",        state: "Selangor",            lat: 3.0590,  lon: 101.5840 },
  { label: "Ampang",             state: "Selangor",            lat: 3.1481,  lon: 101.7626 },
  { label: "George Town (Penang)",state: "Pulau Pinang",       lat: 5.4141,  lon: 100.3288 },
  { label: "Butterworth",        state: "Pulau Pinang",        lat: 5.3993,  lon: 100.3639 },
  { label: "Ipoh",               state: "Perak",               lat: 4.5975,  lon: 101.0901 },
  { label: "Taiping",            state: "Perak",               lat: 4.8510,  lon: 100.7422 },
  { label: "Johor Bahru",        state: "Johor",               lat: 1.4927,  lon: 103.7414 },
  { label: "Batu Pahat",         state: "Johor",               lat: 1.8530,  lon: 102.9329 },
  { label: "Seremban",           state: "Negeri Sembilan",     lat: 2.7297,  lon: 101.9381 },
  { label: "Melaka (Malacca)",   state: "Melaka",              lat: 2.1896,  lon: 102.2501 },
  { label: "Kuantan",            state: "Pahang",              lat: 3.8077,  lon: 103.3260 },
  { label: "Temerloh",           state: "Pahang",              lat: 3.4517,  lon: 102.4187 },
  { label: "Kota Bharu",         state: "Kelantan",            lat: 6.1248,  lon: 102.2380 },
  { label: "Kuala Terengganu",   state: "Terengganu",          lat: 5.3296,  lon: 103.1370 },
  { label: "Alor Setar",         state: "Kedah",               lat: 6.1248,  lon: 100.3672 },
  { label: "Kangar",             state: "Perlis",              lat: 6.4414,  lon: 100.1986 },
  // East Malaysia
  { label: "Kuching",            state: "Sarawak",             lat: 1.5535,  lon: 110.3593 },
  { label: "Miri",               state: "Sarawak",             lat: 4.3995,  lon: 114.0030 },
  { label: "Sibu",               state: "Sarawak",             lat: 2.2870,  lon: 111.8256 },
  { label: "Kota Kinabalu",      state: "Sabah",               lat: 5.9804,  lon: 116.0735 },
  { label: "Sandakan",           state: "Sabah",               lat: 5.8402,  lon: 118.1179 },
  { label: "Tawau",              state: "Sabah",               lat: 4.2456,  lon: 117.8912 },
  { label: "Labuan",             state: "W.P. Labuan",         lat: 5.2831,  lon: 115.2308 },
];
