/**
 * Official Indian GST HSN (Goods) & SAC (Services) Master Directory
 * Contains authentic 4 to 6-digit statutory codes, descriptions,
 * search aliases, standard GST tax slabs, and UQC units based on CBIC guidelines.
 */

export interface GstMasterItem {
  id: number;
  code: string;
  type: 'Goods' | 'Services';
  category: string;
  description: string;
  searchTerms: string;
  defaultGSTPercentage: number; // 0, 3, 5, 12, 18, 28
  uqc: string;                  // PCS, KGS, LTR, MTR, NOS, BOX, PKT, etc.
}

// ─── Indian HSN Codes (Goods / Commodities) ───────────────────

export const INDIAN_HSN_MASTER: GstMasterItem[] = [
  // Groceries, Grains & Staples
  {
    id: 101,
    code: '1006',
    type: 'Goods',
    category: 'Groceries & Grains',
    description: 'Rice, paddy, husked rice, semi-milled or wholly milled rice (Basmati / Sona Masoori / Raw rice)',
    searchTerms: 'rice paddy basmati sona masoori raw boiled grain kirana food dawat',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 102,
    code: '1001',
    type: 'Goods',
    category: 'Groceries & Grains',
    description: 'Wheat and meslin, durum wheat, seed wheat',
    searchTerms: 'wheat godhumalu grain cereal farm crop',
    defaultGSTPercentage: 0,
    uqc: 'KGS'
  },
  {
    id: 103,
    code: '1101',
    type: 'Goods',
    category: 'Groceries & Grains',
    description: 'Wheat or meslin flour (Atta, Maida, Sooji, Rava)',
    searchTerms: 'atta maida sooji rava wheat flour aashirvaad pilsbury chakki',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 104,
    code: '0713',
    type: 'Goods',
    category: 'Groceries & Grains',
    description: 'Dried leguminous vegetables, shelled (Toor Dal, Moong Dal, Chana Dal, Urad Dal, Rajma)',
    searchTerms: 'dal toor dal moong dal urad dal chana dal pulses lentils rajma chole grams',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 105,
    code: '1701',
    type: 'Goods',
    category: 'Groceries & Grains',
    description: 'Cane or beet sugar, chemically pure sucrose in solid form',
    searchTerms: 'sugar panchadara chini sweet sweetener jaggery sucrose',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 106,
    code: '1702',
    type: 'Goods',
    category: 'Groceries & Grains',
    description: 'Jaggery, Gur, caramel, molasses and natural invert sugars',
    searchTerms: 'jaggery bellam gur brown sugar natural sweet',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 107,
    code: '1507',
    type: 'Goods',
    category: 'Oils & Fats',
    description: 'Soya-bean oil and its fractions, edible grade',
    searchTerms: 'soya oil refined oil edible cooking oil fortune',
    defaultGSTPercentage: 5,
    uqc: 'LTR'
  },
  {
    id: 108,
    code: '1512',
    type: 'Goods',
    category: 'Oils & Fats',
    description: 'Sunflower-seed, safflower or cotton-seed oil and fractions',
    searchTerms: 'sunflower oil freedom sunflower gold drop edible cooking oil',
    defaultGSTPercentage: 5,
    uqc: 'LTR'
  },
  {
    id: 109,
    code: '1513',
    type: 'Goods',
    category: 'Oils & Fats',
    description: 'Coconut (copra), palm kernel or babassu oil and fractions',
    searchTerms: 'coconut oil kobbari nune parachute edible hair oil',
    defaultGSTPercentage: 5,
    uqc: 'LTR'
  },
  {
    id: 110,
    code: '1514',
    type: 'Goods',
    category: 'Oils & Fats',
    description: 'Rape, colza or mustard oil and its fractions',
    searchTerms: 'mustard oil sarson tel cooking oil',
    defaultGSTPercentage: 5,
    uqc: 'LTR'
  },
  {
    id: 111,
    code: '0901',
    type: 'Goods',
    category: 'Beverages & Spices',
    description: 'Coffee, whether or not roasted or decaffeinated, coffee husks',
    searchTerms: 'coffee nescafe bru filter coffee roast beans instant coffee',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 112,
    code: '0902',
    type: 'Goods',
    category: 'Beverages & Spices',
    description: 'Tea, whether or not flavoured (Black tea, Green tea, Tea bags)',
    searchTerms: 'tea chai red label taj mahal wagh bakri green tea tea dust',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 113,
    code: '0910',
    type: 'Goods',
    category: 'Beverages & Spices',
    description: 'Ginger, saffron, turmeric (curcuma), thyme, bay leaves, curry and other spices',
    searchTerms: 'turmeric pasupu ginger allam spices masala mirchi powder chili garam masala',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 114,
    code: '2501',
    type: 'Goods',
    category: 'Groceries & Grains',
    description: 'Salt (including table salt and denatured salt), pure sodium chloride',
    searchTerms: 'salt uppu tata salt iodized salt rock salt',
    defaultGSTPercentage: 0,
    uqc: 'KGS'
  },

  // Dairy & Bakery
  {
    id: 115,
    code: '0401',
    type: 'Goods',
    category: 'Dairy Products',
    description: 'Milk and cream, not concentrated nor containing added sugar (Pasteurized fresh milk)',
    searchTerms: 'milk amul nandini heritage vijaya fresh milk cream dairy',
    defaultGSTPercentage: 0,
    uqc: 'LTR'
  },
  {
    id: 116,
    code: '0402',
    type: 'Goods',
    category: 'Dairy Products',
    description: 'Milk and cream, concentrated or containing added sugar, milk powder',
    searchTerms: 'milk powder dairy whitener condensed milk everyday amulya',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 117,
    code: '0405',
    type: 'Goods',
    category: 'Dairy Products',
    description: 'Butter, dairy spreads, ghee (clarified butter)',
    searchTerms: 'butter ghee neyyi amul butter cow ghee buffalo ghee',
    defaultGSTPercentage: 12,
    uqc: 'KGS'
  },
  {
    id: 118,
    code: '0406',
    type: 'Goods',
    category: 'Dairy Products',
    description: 'Cheese and curd, paneer (cottage cheese)',
    searchTerms: 'cheese paneer mozzarella curd dahi cottage cheese',
    defaultGSTPercentage: 5,
    uqc: 'KGS'
  },
  {
    id: 119,
    code: '1905',
    type: 'Goods',
    category: 'Bakery & Confectionery',
    description: 'Bread, pastry, cakes, biscuits, cookies, rusks and other bakers wares',
    searchTerms: 'biscuit bread cake pastry cookies rusk parle-g britannia oreo bakery',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 120,
    code: '2106',
    type: 'Goods',
    category: 'Packaged Foods',
    description: 'Food preparations not elsewhere specified (Namkeen, Sweets, Bhujia, Instant mixes, Gulab Jamun mix)',
    searchTerms: 'namkeen sweets haldiram snacks mixtures bhujia chips kurkure instant mix',
    defaultGSTPercentage: 12,
    uqc: 'KGS'
  },
  {
    id: 121,
    code: '2201',
    type: 'Goods',
    category: 'Packaged Foods',
    description: 'Waters, including natural or artificial mineral waters, packaged drinking water',
    searchTerms: 'mineral water bisleri kinley aquafina drinking water bottle 20L can',
    defaultGSTPercentage: 18,
    uqc: 'BTL'
  },
  {
    id: 122,
    code: '2202',
    type: 'Goods',
    category: 'Packaged Foods',
    description: 'Waters with added sugar or flavour, aerated drinks, cola, lemonades, fruit juices',
    searchTerms: 'coca cola pepsi thums up sprite fanta cold drink soda soft drink juice frooti',
    defaultGSTPercentage: 28,
    uqc: 'BTL'
  },

  // FMCG, Cosmetics & Personal Care
  {
    id: 123,
    code: '3401',
    type: 'Goods',
    category: 'Personal Care & Hygiene',
    description: 'Soap, organic surface-active products and preparations for use as soap (Bathing bars, toilet soaps)',
    searchTerms: 'soap bathing soap dove lux lifebuoy dettol pears medimix body wash',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 124,
    code: '3402',
    type: 'Goods',
    category: 'Personal Care & Hygiene',
    description: 'Washing powder, laundry detergents, dishwashing liquids, surface cleaning agents',
    searchTerms: 'surf excel ariel tide detergent washing powder vim bar dishwash harpic lizol cleaner',
    defaultGSTPercentage: 18,
    uqc: 'KGS'
  },
  {
    id: 125,
    code: '3305',
    type: 'Goods',
    category: 'Personal Care & Hygiene',
    description: 'Preparations for use on the hair (Shampoos, hair conditioners, hair oils, hair dyes)',
    searchTerms: 'shampoo hair oil clinic plus sunsilk pantene head and shoulders vatika bajaj almond',
    defaultGSTPercentage: 18,
    uqc: 'BTL'
  },
  {
    id: 126,
    code: '3306',
    type: 'Goods',
    category: 'Personal Care & Hygiene',
    description: 'Preparations for oral or dental hygiene, including dentifrices (Toothpaste, toothpowder, mouthwash)',
    searchTerms: 'toothpaste colgate pepsodent dabur red sensodyne close up brush mouthwash',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 127,
    code: '3304',
    type: 'Goods',
    category: 'Personal Care & Hygiene',
    description: 'Beauty or make-up preparations, skin-care creams, sunscreens, talcum powder',
    searchTerms: 'face cream fair lovely ponds nivea sunscreen lotion talc powder makeup cosmetics',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 128,
    code: '9619',
    type: 'Goods',
    category: 'Personal Care & Hygiene',
    description: 'Sanitary towels (pads) and tampons, napkins and napkin liners for babies (Diapers)',
    searchTerms: 'sanitary pads whisper stayfree napkins pampers diapers baby care huggies',
    defaultGSTPercentage: 0,
    uqc: 'PKT'
  },

  // Pharmaceuticals & Medical
  {
    id: 129,
    code: '3004',
    type: 'Goods',
    category: 'Healthcare & Pharma',
    description: 'Medicaments consisting of mixed or unmixed products for therapeutic uses (Tablets, capsules, syrups, antibiotics)',
    searchTerms: 'medicine tablet capsule paracetamol dolo antibiotic cough syrup pharmacy drug injection',
    defaultGSTPercentage: 12,
    uqc: 'BOX'
  },
  {
    id: 130,
    code: '3005',
    type: 'Goods',
    category: 'Healthcare & Pharma',
    description: 'Wadding, gauze, bandages, adhesive plasters, surgical dressings, first-aid kits',
    searchTerms: 'bandage band-aid cotton gauze dettol antiseptic plaster first aid medical',
    defaultGSTPercentage: 12,
    uqc: 'PCS'
  },
  {
    id: 131,
    code: '9018',
    type: 'Goods',
    category: 'Healthcare & Pharma',
    description: 'Medical, surgical, dental or veterinary instruments, BP monitors, thermometers, glucose meters',
    searchTerms: 'bp monitor thermometer glucometer syringe pulse oximeter medical equipment',
    defaultGSTPercentage: 12,
    uqc: 'PCS'
  },

  // Textiles, Garments & Footwear
  {
    id: 132,
    code: '6109',
    type: 'Goods',
    category: 'Textiles & Apparel',
    description: 'T-shirts, singlets and other vests, knitted or crocheted (Cotton, Polyester, Blends)',
    searchTerms: 't-shirt tshirt tee polo vest banyan round neck collar shirt',
    defaultGSTPercentage: 5,
    uqc: 'PCS'
  },
  {
    id: 133,
    code: '6203',
    type: 'Goods',
    category: 'Textiles & Apparel',
    description: "Men's or boys' suits, jackets, blazers, trousers, shirts, jeans",
    searchTerms: 'shirt pants trousers jeans denim formal shirt suit blazer kurtas men apparel',
    defaultGSTPercentage: 5,
    uqc: 'PCS'
  },
  {
    id: 134,
    code: '6204',
    type: 'Goods',
    category: 'Textiles & Apparel',
    description: "Women's or girls' suits, dresses, skirts, sarees, kurtis, churidars, salwar suits",
    searchTerms: 'saree kurti dress lehenga salwar kameez women wear churidar dupatta',
    defaultGSTPercentage: 5,
    uqc: 'PCS'
  },
  {
    id: 135,
    code: '6403',
    type: 'Goods',
    category: 'Textiles & Apparel',
    description: 'Footwear with outer soles of rubber, plastics, leather (Shoes, boots, leather sandals)',
    searchTerms: 'shoes leather shoes formal shoes boots sneakers sandals bata paragon woodland',
    defaultGSTPercentage: 12,
    uqc: 'PRS'
  },
  {
    id: 136,
    code: '6402',
    type: 'Goods',
    category: 'Textiles & Apparel',
    description: 'Footwear with outer soles and uppers of rubber or plastics (Slippers, chappals, flip-flops)',
    searchTerms: 'slippers chappal flip flops crocs rubber footwear hawai chappal relaxo',
    defaultGSTPercentage: 12,
    uqc: 'PRS'
  },

  // Electronics & Mobile Devices
  {
    id: 137,
    code: '8517',
    type: 'Goods',
    category: 'Electronics & Mobiles',
    description: 'Telephone sets, smartphones, feature phones, telecommunication apparatus, mobile chargers',
    searchTerms: 'mobile phone smartphone redmi realme samsung apple iphone charger adapter headset',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 138,
    code: '8471',
    type: 'Goods',
    category: 'Electronics & Mobiles',
    description: 'Automatic data processing machines (Laptops, desktops, microprocessors, tablets, hard drives)',
    searchTerms: 'laptop computer desktop pc cpu monitor dell hp lenovo keyboard mouse hard disk ssd',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 139,
    code: '8528',
    type: 'Goods',
    category: 'Electronics & Mobiles',
    description: 'Monitors and projectors, television reception apparatus (LED/Smart TV)',
    searchTerms: 'tv television smart tv led tv monitor display screen sony samsung lg mi',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 140,
    code: '8415',
    type: 'Goods',
    category: 'Electronics & Mobiles',
    description: 'Air conditioning machines (Window AC, Split AC, Inverter AC, Heat pumps)',
    searchTerms: 'air conditioner ac split ac inverter ac voltas daikin lg blue star cooling',
    defaultGSTPercentage: 28,
    uqc: 'PCS'
  },
  {
    id: 141,
    code: '8418',
    type: 'Goods',
    category: 'Electronics & Mobiles',
    description: 'Refrigerators, freezers and other refrigerating equipment (Single door, Double door fridge)',
    searchTerms: 'refrigerator fridge freezer whirlpool godrej samsung lg cooling appliance',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 142,
    code: '8450',
    type: 'Goods',
    category: 'Electronics & Mobiles',
    description: 'Household or laundry-type washing machines (Top load, Front load, Semi-automatic)',
    searchTerms: 'washing machine laundry top load front load dryer ifb bosch whirlpool',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 143,
    code: '8507',
    type: 'Goods',
    category: 'Electronics & Mobiles',
    description: 'Electric accumulators, lead-acid storage batteries, inverter batteries',
    searchTerms: 'battery inverter battery car battery exide luminous amaron power backup',
    defaultGSTPercentage: 28,
    uqc: 'PCS'
  },
  {
    id: 144,
    code: '8504',
    type: 'Goods',
    category: 'Electronics & Mobiles',
    description: 'Electrical transformers, static converters (Inverters, UPS, mobile adapters, power supplies)',
    searchTerms: 'inverter ups power adapter charger transformer stabilizer microtek vguard',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 145,
    code: '9405',
    type: 'Goods',
    category: 'Electrical & Lighting',
    description: 'Luminaires and lighting fittings (LED bulbs, tube lights, panel lights, flood lights)',
    searchTerms: 'led bulb tube light lamp light fitting philips wipro havells syska illumination',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 146,
    code: '8544',
    type: 'Goods',
    category: 'Electrical & Lighting',
    description: 'Insulated wire, cable, optical fibre cables, electric copper wires',
    searchTerms: 'electric wire cable copper wire finolex havells polycab wiring electrical',
    defaultGSTPercentage: 18,
    uqc: 'MTR'
  },

  // Stationery, Books & Toys
  {
    id: 147,
    code: '4820',
    type: 'Goods',
    category: 'Stationery & Office',
    description: 'Registers, account books, note books, order books, receipt books, letter pads, diaries',
    searchTerms: 'notebook book register diary notepad stationery paper classmate camlin',
    defaultGSTPercentage: 12,
    uqc: 'PCS'
  },
  {
    id: 148,
    code: '9608',
    type: 'Goods',
    category: 'Stationery & Office',
    description: 'Ball point pens, felt tipped and other porous-tipped pens, fountain pens, markers',
    searchTerms: 'pen ball pen gel pen marker ink pen cello reynolds flair classmate stationery',
    defaultGSTPercentage: 12,
    uqc: 'PCS'
  },
  {
    id: 149,
    code: '4901',
    type: 'Goods',
    category: 'Stationery & Office',
    description: 'Printed books, brochures, leaflets and similar printed matter (Textbooks, literature)',
    searchTerms: 'books printed books textbooks educational reading material novel',
    defaultGSTPercentage: 0,
    uqc: 'PCS'
  },

  // Hardware & Construction
  {
    id: 150,
    code: '7214',
    type: 'Goods',
    category: 'Hardware & Building',
    description: 'Iron and steel bars and rods, hot-rolled, deformed (TMT bars, rebars for construction)',
    searchTerms: 'tmt steel iron rods sariya construction tata tiscon jsw jindal building material',
    defaultGSTPercentage: 18,
    uqc: 'TON'
  },
  {
    id: 151,
    code: '2523',
    type: 'Goods',
    category: 'Hardware & Building',
    description: 'Portland cement, aluminous cement, slag cement and similar hydraulic cements',
    searchTerms: 'cement ultratech acc ambuja dalmia construction building bag cement 50kg',
    defaultGSTPercentage: 28,
    uqc: 'BAG'
  },
  {
    id: 152,
    code: '6907',
    type: 'Goods',
    category: 'Hardware & Building',
    description: 'Ceramic flags and paving, hearth or wall tiles, glazed ceramic tiles',
    searchTerms: 'tiles floor tiles wall tiles ceramic vitrified kajaria somany granite marble',
    defaultGSTPercentage: 18,
    uqc: 'SQF'
  },
  {
    id: 153,
    code: '3209',
    type: 'Goods',
    category: 'Hardware & Building',
    description: 'Paints and varnishes based on synthetic polymers, wall emulsions, distempers',
    searchTerms: 'paint wall paint emulsion primer distemper asian paints berger nerolac enamel',
    defaultGSTPercentage: 18,
    uqc: 'LTR'
  },

  // Automobile & Transport
  {
    id: 154,
    code: '8708',
    type: 'Goods',
    category: 'Automotive & Spares',
    description: 'Parts and accessories of the motor vehicles (Car spare parts, brake pads, filters, clutch)',
    searchTerms: 'car parts spare parts auto accessories brake pad clutch filter auto spare',
    defaultGSTPercentage: 28,
    uqc: 'PCS'
  },
  {
    id: 155,
    code: '8714',
    type: 'Goods',
    category: 'Automotive & Spares',
    description: 'Parts and accessories of motorcycles, scooters, mopeds and bicycles',
    searchTerms: 'bike parts motorcycle spares bike chain helmet scooter parts hero honda bajaj',
    defaultGSTPercentage: 28,
    uqc: 'PCS'
  },
  {
    id: 156,
    code: '4011',
    type: 'Goods',
    category: 'Automotive & Spares',
    description: 'New pneumatic tyres of rubber for motor cars, motorcycles, trucks, bicycles',
    searchTerms: 'tyre tire mrf apollo ceat bridgestone bike tyre car tyre tube',
    defaultGSTPercentage: 28,
    uqc: 'PCS'
  },

  // Furniture & Jewellery
  {
    id: 157,
    code: '9403',
    type: 'Goods',
    category: 'Furniture',
    description: 'Other furniture and parts thereof (Wooden tables, office chairs, metal racks, wardrobes)',
    searchTerms: 'furniture table chair office chair desk bed wardrobe sofa cupboard godrej',
    defaultGSTPercentage: 18,
    uqc: 'PCS'
  },
  {
    id: 158,
    code: '7113',
    type: 'Goods',
    category: 'Jewellery & Precious',
    description: 'Articles of jewellery and parts thereof, of precious metal (Gold, Silver, Platinum jewellery)',
    searchTerms: 'gold jewellery silver ornament ring necklace chain bangles earrings hallmark',
    defaultGSTPercentage: 3,
    uqc: 'GMS'
  }
];

// ─── Indian SAC Codes (Services) ──────────────────────────────

export const INDIAN_SAC_MASTER: GstMasterItem[] = [
  // Hospitality, Food & Accommodation
  {
    id: 201,
    code: '996331',
    type: 'Services',
    category: 'Hospitality & Food',
    description: 'Services provided by restaurants, cafes, fast food joints, mess and tiffin centers',
    searchTerms: 'restaurant food dining meal tiffin mess thali dosa biryani idly snacks cafe eatery',
    defaultGSTPercentage: 5,
    uqc: 'NOS'
  },
  {
    id: 202,
    code: '996332',
    type: 'Services',
    category: 'Hospitality & Food',
    description: 'Takeaway food and cloud kitchen services, doorstep food delivery packaging',
    searchTerms: 'takeaway parcel food delivery cloud kitchen swiggy zomato pack food order',
    defaultGSTPercentage: 5,
    uqc: 'NOS'
  },
  {
    id: 203,
    code: '996333',
    type: 'Services',
    category: 'Hospitality & Food',
    description: 'Outdoor catering services for weddings, corporate events, parties and functions',
    searchTerms: 'catering outdoor catering wedding food party catering buffet event catering',
    defaultGSTPercentage: 5,
    uqc: 'NOS'
  },
  {
    id: 204,
    code: '996311',
    type: 'Services',
    category: 'Hospitality & Food',
    description: 'Room accommodation services provided by hotels, motels, guest houses (Declared tariff < ₹7,500/night)',
    searchTerms: 'hotel room lodge accommodation stay guest house room rent room booking',
    defaultGSTPercentage: 12,
    uqc: 'NOS'
  },
  {
    id: 205,
    code: '996312',
    type: 'Services',
    category: 'Hospitality & Food',
    description: 'Room accommodation services by luxury hotels and resorts (Declared tariff ≥ ₹7,500/night)',
    searchTerms: 'luxury hotel resort 5 star suite room booking staycation',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },

  // Personal Care, Salon & Wellness
  {
    id: 206,
    code: '999721',
    type: 'Services',
    category: 'Personal Care & Wellness',
    description: 'Hairdressing and beauty treatment services (Salon, barber, haircut, shaving, facial, hair spa)',
    searchTerms: 'salon barber haircut styling facial bleach threading beauty parlour grooming makeup beard',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 207,
    code: '999722',
    type: 'Services',
    category: 'Personal Care & Wellness',
    description: 'Physical well-being services, sauna, steam baths, body massage, aroma therapy, spa treatments',
    searchTerms: 'spa massage body massage steam bath wellness aromatherapy relaxation therapy',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 208,
    code: '999511',
    type: 'Services',
    category: 'Personal Care & Wellness',
    description: 'Gymnasium, health club, physical fitness center, yoga studio and aerobics memberships',
    searchTerms: 'gym fitness health club workout membership yoga personal trainer bodybuilding',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },

  // IT, Software & Digital Services
  {
    id: 209,
    code: '998313',
    type: 'Services',
    category: 'IT & Digital Services',
    description: 'Information technology (IT) design and development services for applications and software',
    searchTerms: 'software development it services web development mobile app coding programming custom software',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 210,
    code: '998314',
    type: 'Services',
    category: 'IT & Digital Services',
    description: 'Website design, web hosting, domain registration, server management and cloud infrastructure',
    searchTerms: 'website design web hosting cloud aws domain server ui ux website development',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 211,
    code: '998315',
    type: 'Services',
    category: 'IT & Digital Services',
    description: 'IT technical support, computer systems and network maintenance services',
    searchTerms: 'it support tech support networking troubleshooting computer maintenance amc it',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 212,
    code: '998361',
    type: 'Services',
    category: 'IT & Digital Services',
    description: 'Advertising, digital marketing, social media marketing (SEO, SEM, Google Ads, Meta Ads)',
    searchTerms: 'digital marketing advertising seo google ads social media meta ads branding campaign promotion',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },

  // Repairs & Maintenance
  {
    id: 213,
    code: '998713',
    type: 'Services',
    category: 'Repairs & Maintenance',
    description: 'Maintenance and repair of computers, laptops, printers and peripheral equipment',
    searchTerms: 'computer repair laptop repair printer service screen replacement battery replacement hardware fixing',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 214,
    code: '998714',
    type: 'Services',
    category: 'Repairs & Maintenance',
    description: 'Maintenance and repair of electrical household appliances (Air conditioners, washing machines, refrigerators, TVs)',
    searchTerms: 'ac repair fridge repair washing machine service tv repair appliance service technician gas charging',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 215,
    code: '998729',
    type: 'Services',
    category: 'Repairs & Maintenance',
    description: 'Maintenance, repair, servicing and washing of motor vehicles and motorcycles (Garage & mechanic services)',
    searchTerms: 'car repair bike service mechanic oil change wheel alignment car wash garage servicing puncture',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 216,
    code: '998719',
    type: 'Services',
    category: 'Repairs & Maintenance',
    description: 'Repair and servicing of other consumer goods (Watches, clocks, jewellery, mobile phones display)',
    searchTerms: 'mobile repair screen fix battery replacement watch repair mobile screen glass replacement',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },

  // Professional & Financial Services
  {
    id: 217,
    code: '998221',
    type: 'Services',
    category: 'Professional & Business',
    description: 'Financial auditing, accounting, book-keeping and GST tax compliance services (CA services)',
    searchTerms: 'accounting chartered accountant ca audit gst filing bookkeeping income tax return itr tax consultant',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 218,
    code: '998211',
    type: 'Services',
    category: 'Professional & Business',
    description: 'Legal documentation, advisory, representation and advocate consulting services',
    searchTerms: 'legal lawyer advocate agreement deed affidavit court consulting legal advice',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 219,
    code: '998311',
    type: 'Services',
    category: 'Professional & Business',
    description: 'Management consulting, business strategy, operations and advisory services',
    searchTerms: 'consulting business consulting management advisory strategy corporate advice',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },

  // Transport & Logistics
  {
    id: 220,
    code: '996511',
    type: 'Services',
    category: 'Transport & Logistics',
    description: 'Road freight transportation services by Goods Transport Agency (GTA) (Lorries, trucks, tempo)',
    searchTerms: 'transport lorry freight tempo truck transport gta goods transport cargo logistics',
    defaultGSTPercentage: 5,
    uqc: 'NOS'
  },
  {
    id: 221,
    code: '996512',
    type: 'Services',
    category: 'Transport & Logistics',
    description: 'Courier, parcel delivery and postal transport services',
    searchTerms: 'courier parcel delivery shipping dtdc bluedart speed post dispatch logistics',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 222,
    code: '996531',
    type: 'Services',
    category: 'Transport & Logistics',
    description: 'Passenger road transport (Taxi, auto rickshaw, radio taxi, cab aggregators, tour buses)',
    searchTerms: 'taxi cab car rental travel bus tour travel passenger vehicle hire',
    defaultGSTPercentage: 5,
    uqc: 'NOS'
  },

  // Construction, Renovation & Facilities
  {
    id: 223,
    code: '995411',
    type: 'Services',
    category: 'Construction & Works',
    description: 'General construction services of residential and commercial buildings',
    searchTerms: 'construction building civil contractor masonry builder structural work renovation',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 224,
    code: '995421',
    type: 'Services',
    category: 'Construction & Works',
    description: 'Plumbing, electrical wiring, sanitary, false ceiling and carpentry installation services',
    searchTerms: 'plumbing electrician electrical carpentry wiring false ceiling sanitary fitting',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 225,
    code: '995422',
    type: 'Services',
    category: 'Construction & Works',
    description: 'Painting, plastering, glazing and decorative interior finishing services',
    searchTerms: 'painting wall painting whitewash interior design decoration texture putty polish',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 226,
    code: '998531',
    type: 'Services',
    category: 'Facility & Cleaning',
    description: 'Commercial cleaning, housekeeping, janitorial and deep-cleaning services',
    searchTerms: 'cleaning deep cleaning housekeeping floor scrubbing sanitization office cleaning',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 227,
    code: '998532',
    type: 'Services',
    category: 'Facility & Cleaning',
    description: 'Pest control, disinfection, termite treatment and fumigation services',
    searchTerms: 'pest control termite cockroach bedbugs fumigation rodent treatment disinfection',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },

  // Education & Training
  {
    id: 228,
    code: '999210',
    type: 'Services',
    category: 'Education & Training',
    description: 'Commercial tuition centers, competitive coaching institutes, test prep (IIT/NEET/Banking)',
    searchTerms: 'coaching tuition institute classes training classes test prep competitive exam',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 229,
    code: '999293',
    type: 'Services',
    category: 'Education & Training',
    description: 'Vocational training, computer institutes, driving schools, dance, music and arts academy',
    searchTerms: 'computer institute driving school vocational training dance class music classes skills academy',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },

  // Healthcare (Exempt under GST)
  {
    id: 230,
    code: '999312',
    type: 'Services',
    category: 'Healthcare & Clinical',
    description: 'Medical consultancy and clinical healthcare services by qualified doctors and physicians',
    searchTerms: 'doctor consultation clinic medical OPD physician specialist healthcare treatment',
    defaultGSTPercentage: 0,
    uqc: 'NOS'
  },
  {
    id: 231,
    code: '999313',
    type: 'Services',
    category: 'Healthcare & Clinical',
    description: 'Dental practice, teeth cleaning, root canal, dental surgery and orthodontics',
    searchTerms: 'dentist dental clinic teeth cleaning root canal braces dental doctor',
    defaultGSTPercentage: 0,
    uqc: 'NOS'
  },
  {
    id: 232,
    code: '999314',
    type: 'Services',
    category: 'Healthcare & Clinical',
    description: 'Diagnostic imaging, pathology lab testing, blood tests, urine tests and scan centers',
    searchTerms: 'pathology lab blood test lab tests diagnostic center scan x-ray mri urine test',
    defaultGSTPercentage: 0,
    uqc: 'NOS'
  },

  // Events, Media & Photography
  {
    id: 233,
    code: '998611',
    type: 'Services',
    category: 'Events & Media',
    description: 'Event management, wedding planning, stage decoration, party organizing services',
    searchTerms: 'event management wedding planner decoration sound lighting dj party planner stage decor',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 234,
    code: '998612',
    type: 'Services',
    category: 'Events & Media',
    description: 'Photography and videography services (Pre-wedding, event video shoot, studio portraits)',
    searchTerms: 'photography photo shoot video shoot studio wedding photography album drone shoot videographer',
    defaultGSTPercentage: 18,
    uqc: 'NOS'
  },
  {
    id: 235,
    code: '998811',
    type: 'Services',
    category: 'Tailoring & Job Work',
    description: 'Tailoring services, bespoke clothing, garment stitching, alterations and textile job work',
    searchTerms: 'tailor stitching blouse stitching alteration tailoring suit stitching dressmaking boutique',
    defaultGSTPercentage: 5,
    uqc: 'NOS'
  }
];

// ─── Search Utility ──────────────────────────────────────────

/**
 * Searches the authentic Indian GST master directory using fast multi-term matching
 */
export function searchGstMaster(
  query: string,
  type: 'Goods' | 'Services'
): GstMasterItem[] {
  const masterList = type === 'Goods' ? INDIAN_HSN_MASTER : INDIAN_SAC_MASTER;
  
  if (!query || !query.trim()) {
    // Return top 25 popular items if search is empty
    return masterList.slice(0, 25);
  }

  const cleanQuery = query.trim().toLowerCase();
  const searchTokens = cleanQuery.split(/\s+/).filter(Boolean);

  const matched = masterList.filter(item => {
    // Exact or partial code match
    if (item.code.toLowerCase().includes(cleanQuery)) return true;
    
    // Check if any token matches description, category, or search terms
    const textBlob = `${item.description} ${item.category} ${item.searchTerms}`.toLowerCase();
    return searchTokens.every(tok => textBlob.includes(tok));
  });

  return matched.slice(0, 30);
}
