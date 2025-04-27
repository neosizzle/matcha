import cities from 'cities.json' with { type: 'json' }
import fs from 'fs'
const MY_ADMIN1 = [{
    "code": "MY.04",
    "name": "Melaka"
  },
  {
    "code": "MY.13",
    "name": "Terengganu"
  },
  {
    "code": "MY.12",
    "name": "Selangor"
  },
  {
    "code": "MY.11",
    "name": "Sarawak"
  },
  {
    "code": "MY.16",
    "name": "Sabah"
  },
  {
    "code": "MY.08",
    "name": "Perlis"
  },
  {
    "code": "MY.07",
    "name": "Perak"
  },
  {
    "code": "MY.06",
    "name": "Pahang"
  },
  {
    "code": "MY.05",
    "name": "Negeri Sembilan"
  },
  {
    "code": "MY.03",
    "name": "Kelantan"
  },
  {
    "code": "MY.14",
    "name": "Kuala Lumpur"
  },
  {
    "code": "MY.09",
    "name": "Penang"
  },
  {
    "code": "MY.02",
    "name": "Kedah"
  },
  {
    "code": "MY.01",
    "name": "Johor"
  },
  {
    "code": "MY.15",
    "name": "Labuan"
  },
  {
    "code": "MY.17",
    "name": "Putrajaya"
  }]

const MY_ADMIN2 = [{
    "code": "MY.02.0207",
    "name": "Langkawi"
  },
  {
    "code": "MY.06.0811",
    "name": "Temerluh"
  },
  {
    "code": "MY.01.0101",
    "name": "Daerah Batu Pahat"
  },
  {
    "code": "MY.01.0109",
    "name": "Daerah Pontian"
  },
  {
    "code": "MY.01.0104",
    "name": "Daerah Kota Tinggi"
  },
  {
    "code": "MY.01.0102",
    "name": "Daerah Johor Baharu"
  },
  {
    "code": "MY.01.0103",
    "name": "Daerah Keluang"
  },
  {
    "code": "MY.01.0107",
    "name": "Daerah Mersing"
  },
  {
    "code": "MY.01.0110",
    "name": "Daerah Segamat"
  },
  {
    "code": "MY.01.0108",
    "name": "Daerah Muar"
  },
  {
    "code": "MY.12.1706",
    "name": "Kuala Selangor"
  },
  {
    "code": "MY.12.1704",
    "name": "Klang"
  },
  {
    "code": "MY.16.1208",
    "name": "Kuala Penyu"
  },
  {
    "code": "MY.16.1213",
    "name": "Papar"
  },
  {
    "code": "MY.16.1214",
    "name": "Penampang"
  },
  {
    "code": "MY.16.1221",
    "name": "Tambunan"
  },
  {
    "code": "MY.16.1217",
    "name": "Ranau"
  },
  {
    "code": "MY.16.1218",
    "name": "Bahagian Sandakan"
  },
  {
    "code": "MY.16.1222",
    "name": "Bahagian Tawau"
  },
  {
    "code": "MY.16.1219",
    "name": "Semporna"
  },
  {
    "code": "MY.16.1203",
    "name": "Keningau"
  },
  {
    "code": "MY.16.1220",
    "name": "Sipitang"
  },
  {
    "code": "MY.16.1223",
    "name": "Tenom District"
  },
  {
    "code": "MY.16.1201",
    "name": "Beaufort"
  },
  {
    "code": "MY.02.0206",
    "name": "Kulim"
  },
  {
    "code": "MY.07.0908",
    "name": "Larut Matang & Selama"
  },
  {
    "code": "MY.02.0202",
    "name": "Bandar Baharu"
  },
  {
    "code": "MY.02.0201",
    "name": "Baling"
  },
  {
    "code": "MY.03.0309",
    "name": "Tanah Merah"
  },
  {
    "code": "MY.11.1302",
    "name": "Bau"
  },
  {
    "code": "MY.11.1311",
    "name": "Bahagian Kuching"
  },
  {
    "code": "MY.07.0907",
    "name": "Daerah Kuala Kangsar"
  },
  {
    "code": "MY.07.0906",
    "name": "Daerah Kinta"
  },
  {
    "code": "MY.12.1705",
    "name": "Kuala Langat"
  },
  {
    "code": "MY.12.1709",
    "name": "Sepang"
  },
  {
    "code": "MY.06.0810",
    "name": "Daerha Rompin"
  },
  {
    "code": "MY.06.0802",
    "name": "Bera"
  },
  {
    "code": "MY.09.1102",
    "name": "Seberang Perai Selatan"
  },
  {
    "code": "MY.09.1105",
    "name": "Daerah Timur Laut"
  },
  {
    "code": "MY.12.1701",
    "name": "Gombak"
  },
  {
    "code": "MY.12.1703",
    "name": "Hulu Selangor"
  },
  {
    "code": "MY.12.1707",
    "name": "Petaling"
  },
  {
    "code": "MY.12.1702",
    "name": "Hulu Langat"
  },
  {
    "code": "MY.12.1708",
    "name": "Sabak Bernam"
  },
  {
    "code": "MY.06.0804",
    "name": "Daerah Jerantut"
  },
  {
    "code": "MY.06.0803",
    "name": "Cameron Highlands"
  },
  {
    "code": "MY.11.1320",
    "name": "Mukah"
  },
  {
    "code": "MY.02.0212",
    "name": "Yan"
  },
  {
    "code": "MY.11.1326",
    "name": "Serian"
  },
  {
    "code": "MY.11.1324",
    "name": "Bahagian Sarikei"
  },
  {
    "code": "MY.11.1309",
    "name": "Kanowit"
  },
  {
    "code": "MY.02.0205",
    "name": "Kubang Pasu"
  },
  {
    "code": "MY.02.0208",
    "name": "Padang Terap"
  },
  {
    "code": "MY.02.0209",
    "name": "Pendang"
  },
  {
    "code": "MY.02.0203",
    "name": "Daerah Kota Setar"
  },
  {
    "code": "MY.03.0304",
    "name": "Kota Bharu"
  },
  {
    "code": "MY.16.1206",
    "name": "Kota Kinabalu"
  },
  {
    "code": "MY.16.1225",
    "name": "Tuaran"
  },
  {
    "code": "MY.11.1315",
    "name": "Lundu"
  },
  {
    "code": "MY.11.1304",
    "name": "Betong"
  },
  {
    "code": "MY.11.1323",
    "name": "Saratok"
  },
  {
    "code": "MY.11.1314",
    "name": "Lubok Antu"
  },
  {
    "code": "MY.11.1330",
    "name": "Bahagian Sri Aman"
  },
  {
    "code": "MY.11.1327",
    "name": "Bahagian Sibu"
  },
  {
    "code": "MY.11.1329",
    "name": "Song"
  },
  {
    "code": "MY.11.1312",
    "name": "Lawas"
  },
  {
    "code": "MY.11.1313",
    "name": "Bahagian Limbang"
  },
  {
    "code": "MY.11.1303",
    "name": "Belaga"
  },
  {
    "code": "MY.11.1310",
    "name": "Bahagian Kapit"
  },
  {
    "code": "MY.11.1331",
    "name": "Tatau"
  },
  {
    "code": "MY.11.1316",
    "name": "Marudi"
  },
  {
    "code": "MY.11.1319",
    "name": "Bahagian Miri"
  },
  {
    "code": "MY.16.1209",
    "name": "Bahagian Kudat"
  },
  {
    "code": "MY.11.1305",
    "name": "Bahagian Bintulu"
  },
  {
    "code": "MY.11.1322",
    "name": "Bahagian Samarahan"
  },
  {
    "code": "MY.16.1205",
    "name": "Kota Belud"
  },
  {
    "code": "MY.16.1215",
    "name": "Pitas"
  },
  {
    "code": "MY.16.1207",
    "name": "Kota Marudu"
  },
  {
    "code": "MY.16.1204",
    "name": "Kinabatangan"
  },
  {
    "code": "MY.16.1211",
    "name": "Lahad Datu"
  },
  {
    "code": "MY.16.1210",
    "name": "Kunak"
  },
  {
    "code": "MY.02.0211",
    "name": "Sik"
  },
  {
    "code": "MY.02.0204",
    "name": "Kuala Muda"
  },
  {
    "code": "MY.09.1104",
    "name": "Seberang Perai Utara"
  },
  {
    "code": "MY.09.1101",
    "name": "Barat Daya"
  },
  {
    "code": "MY.03.0303",
    "name": "Jeli"
  },
  {
    "code": "MY.03.0307",
    "name": "Pasir Mas"
  },
  {
    "code": "MY.03.0310",
    "name": "Tumpat"
  },
  {
    "code": "MY.03.0305",
    "name": "Kuala Krai"
  },
  {
    "code": "MY.13.1507",
    "name": "Setiu"
  },
  {
    "code": "MY.13.1501",
    "name": "Besut"
  },
  {
    "code": "MY.11.1325",
    "name": "Selangau"
  },
  {
    "code": "MY.16.1202",
    "name": "Beluran"
  },
  {
    "code": "MY.03.0301",
    "name": "Bachok"
  },
  {
    "code": "MY.07.0901",
    "name": "Batang Padang"
  },
  {
    "code": "MY.11.1307",
    "name": "Daro"
  },
  {
    "code": "MY.04.0601",
    "name": "Alor Gajah"
  },
  {
    "code": "MY.11.1301",
    "name": "Asajaya"
  },
  {
    "code": "MY.13.1504",
    "name": "Kemaman"
  },
  {
    "code": "MY.06.0801",
    "name": "Bentong"
  },
  {
    "code": "MY.13.1505",
    "name": "Kuala Terengganu"
  },
  {
    "code": "MY.06.0805",
    "name": "Kuantan"
  },
  {
    "code": "MY.01.0105",
    "name": "Kulaijaya"
  },
  {
    "code": "MY.11.1306",
    "name": "Dalat"
  },
  {
    "code": "MY.13.1503",
    "name": "Hulu Terengganu"
  },
  {
    "code": "MY.05.0701",
    "name": "Jelebu"
  },
  {
    "code": "MY.05.0702",
    "name": "Jempol"
  },
  {
    "code": "MY.06.0809",
    "name": "Raub"
  },
  {
    "code": "MY.11.1318",
    "name": "Meradong"
  },
  {
    "code": "MY.07.0904",
    "name": "Kampar"
  },
  {
    "code": "MY.13.1506",
    "name": "Marang"
  },
  {
    "code": "MY.11.1317",
    "name": "Matu"
  },
  {
    "code": "MY.04.0603",
    "name": "Melaka Tengah"
  },
  {
    "code": "MY.06.0808",
    "name": "Pekan"
  },
  {
    "code": "MY.07.0910",
    "name": "Perak Tengah"
  },
  {
    "code": "MY.08.1001",
    "name": "Perlis"
  },
  {
    "code": "MY.01.0106",
    "name": "Ledang"
  },
  {
    "code": "MY.11.1328",
    "name": "Simunjan"
  },
  {
    "code": "MY.14.0401",
    "name": "WP. Kuala Lumpur"
  },
  {
    "code": "MY.02.0210",
    "name": "Pokok Sena"
  },
  {
    "code": "MY.06.0806",
    "name": "Lipis"
  },
  {
    "code": "MY.07.0903",
    "name": "Ulu Perak"
  },
  {
    "code": "MY.05.0707",
    "name": "Tampin"
  },
  {
    "code": "MY.17.1601",
    "name": "W.P. Putrajaya"
  },
  {
    "code": "MY.05.0705",
    "name": "Rembau"
  },
  {
    "code": "MY.03.0306",
    "name": "Machang"
  },
  {
    "code": "MY.15.0501",
    "name": "W.P. Labuan"
  },
  {
    "code": "MY.06.0807",
    "name": "Maran"
  },
  {
    "code": "MY.11.1321",
    "name": "Pakan"
  },
  {
    "code": "MY.03.0308",
    "name": "Pasir Puteh"
  },
  {
    "code": "MY.16.1216",
    "name": "Putatan"
  },
  {
    "code": "MY.09.1103",
    "name": "S.P. Tengah"
  },
  {
    "code": "MY.05.0706",
    "name": "Seremban"
  },
  {
    "code": "MY.11.1308",
    "name": "Julau"
  },
  {
    "code": "MY.07.0905",
    "name": "Kerian"
  },
  {
    "code": "MY.04.0602",
    "name": "Jasin"
  },
  {
    "code": "MY.16.1224",
    "name": "Tongod"
  },
  {
    "code": "MY.05.0703",
    "name": "Kuala Pilah"
  },
  {
    "code": "MY.13.1502",
    "name": "Dungun"
  },
  {
    "code": "MY.03.0302",
    "name": "Gua Musang"
  },
  {
    "code": "MY.07.0902",
    "name": "Hilir Perak"
  },
  {
    "code": "MY.07.0909",
    "name": "Manjung (Dinding)"
  },
  {
    "code": "MY.16.1212",
    "name": "Nabawan"
  },
  {
    "code": "MY.05.0704",
    "name": "Port Dickson"
  }]

let my_cities = cities.filter((c) => c['country'] == "MY")

const res = my_cities.map((c) => {
	const state_code = c['admin1']
	const state_name = MY_ADMIN1.filter(e => e['code'] == `MY.${state_code}`)[0]['name']
	const district_code = c['admin2']
	let district_name = MY_ADMIN2.filter(e => e['code'] == `MY.${state_code}.${district_code}`)[0]
	if (district_name)
		district_name = district_name['name']
	return {
		name: c['name'],
		district: district_name, 
		state: state_name,
	}
})

const json = JSON.stringify(res);
fs.writeFile('src/places.json', json, 'utf8', () => {console.log("DONE")});
