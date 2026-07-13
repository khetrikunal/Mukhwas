import { Product } from '@/types'

export const DUMMY_PRODUCTS: Product[] = [
  // === PAAN ===
  {
    id: 'd-1',
    name: 'Jaipuri Paan',
    slug: 'jaipuri-paan',
    description: 'Experience the authentic royal taste of Jaipur with our Jaipuri Paan Mukhwas. Crafted using premium betel leaves, aromatic rose petals, sweet fennel seeds, and coconut flakes, this refreshing mouth freshener delivers a rich paan flavor with every bite. Perfect after meals or anytime you want a refreshing and pleasant breath.',
    benefits:'Jaipuri Paan provides long-lasting freshness, helps freshen breath with a sweet paan aroma, supports digestion after meals, offers a refreshing cooling effect, and delivers the authentic taste of traditional Jaipur paan. It is an ideal mouth freshener for everyday enjoyment.',
    ingredients:'Betel Leaves (Paan) ,Rose Petals,Sugar-Coated Fennel Seeds,Coconut Flakes , Menthol ,Natural Flavoring',
    category: { id: 'c-paan', name: 'Paan', slug: 'paan', isActive: true, sortOrder: 1 },
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 'v-1', weightGrams: 100, label: '100 gm', retailPrice: 130, wholesalePrice: 73.5, moq: 10, stockQuantity: 500, sku: 'DM-JAI-100', isActive: true }
    ],
    images: [
      { id: 'img-1-1', imageUrl: '/products/paan/Jaipuri Paan.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-1-2', imageUrl: '/products/paan/jaipuri package (2).jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-2',
    name: 'Banarasi Paan',
    slug: 'banarasi-paan',
    description: 'Banarasi Paan is a premium traditional mouth freshener inspired by the iconic flavors of Banaras. Expertly crafted with fresh pan leaves, sweet gulkand syrup, dry dates, aromatic cardamom, and refreshing menthol, it delivers a rich, sweet, and refreshing paan experience. Enhanced with edible oil and permitted natural food colour, this classic blend offers an authentic taste that refreshes your mouth and leaves a pleasant, long-lasting aroma. It is the perfect choice to enjoy after meals or whenever you desire a refreshing treat.',
    benefits: 'Banarasi Paan provides long-lasting freshness, helps freshen breath with its rich traditional paan aroma, supports healthy digestion after meals, offers a pleasant cooling sensation, and delivers the authentic taste of Banaras. It serves as a delicious and refreshing mouth freshener for everyday enjoyment.',
    ingredients: 'Banarasi Paan is prepared using premium pan leaves, gulkand syrup, dry dates, cardamom, menthol, edible oil, and permitted natural food colour to create its distinctive taste and refreshing flavor',
    category: { id: 'c-paan', name: 'Paan', slug: 'paan', isActive: true, sortOrder: 1 },
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 'v-2', weightGrams: 100, label: '100 gm', retailPrice: 130, wholesalePrice: 73.5, moq: 10, stockQuantity: 500, sku: 'DM-BAN-100', isActive: true }
    ],
    images: [
      { id: 'img-2-1', imageUrl: '/products/paan/Banarasi Paan.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-2-2', imageUrl: '/products/paan/Banarasi Package.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },

  // === SWEET MUKHWAS ===
  {
    id: 'd-3',
    name: 'Shimla Mix Mukhwas',
    slug: 'shimla-mix-mukhwas',
    description: 'Shimla Mix Mukhwas is a refreshing and aromatic blend of carefully selected seeds, coconut, gulkand, and menthol, inspired by the cool and delightful flavors of the hills. This delicious mouth freshener combines the natural goodness of fennel and coriander seeds with the sweetness of sugar and the richness of coconut, creating a perfect balance of taste and freshness. Ideal after meals or at any time of the day, Shimla Mix Mukhwas leaves your mouth feeling cool, refreshed, and pleasantly fragrant.',
    benefits:'Shimla Mix Mukhwas provides a refreshing cooling sensation, freshens breath with its pleasant aroma, supports healthy digestion after meals, offers a delightful blend of sweet and herbal flavors, and serves as an ideal everyday mouth freshener for long-lasting freshness.',
    ingredients:'Shimla Mix Mukhwas is prepared using premium fennel seeds, coriander seeds, sugar, menthol, coconut, gulkand, and natural flavoring to create its unique refreshing taste and aroma.',
    category: { id: 'c-sweet', name: 'Sweet Mukhwas', slug: 'sweet-mukhwas', isActive: true, sortOrder: 2 },
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 'v-3', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-SHM-100', isActive: true }
    ],
    images: [
      { id: 'img-3-1', imageUrl: '/products/sweet-mukhwas/Shimla Mix Mukhwas.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-3-2', imageUrl: '/products/sweet-mukhwas/shimla package.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-4',
    name: 'Satrangi Mukhwas',
    slug: 'satrangi-mukhwas',
    description: 'Satrangi Mukhwas is a vibrant and flavorful mouth freshener that brings together a colorful blend of premium ingredients for a delightful taste experience. Made with aromatic fennel seeds, crunchy sugar balls, coconut, anise seeds, and refreshing menthol, this mouth freshener offers the perfect balance of sweetness, freshness, and natural flavors. Its attractive appearance and delicious taste make it an ideal choice after meals or whenever you want a refreshing treat.',
    benefits:'Satrangi Mukhwas provides long-lasting freshness, freshens breath with its pleasant aroma, supports healthy digestion after meals, offers a delightful combination of multiple flavors, and adds a refreshing and colorful touch to your everyday mouth-freshening experience.',
    ingredients:'Satrangi Mukhwas is prepared using premium fennel seeds, sugar balls, coconut, anise seeds, menthol, and natural flavoring to create its unique colorful appearance and refreshing taste.',
    category: { id: 'c-sweet', name: 'Sweet Mukhwas', slug: 'sweet-mukhwas', isActive: true, sortOrder: 2 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-4', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-SAT-100', isActive: true }
    ],
    images: [
      { id: 'img-4-1', imageUrl: '/products/sweet-mukhwas/Satrangi mukhwas.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-4-2', imageUrl: '/products/sweet-mukhwas/Satrangi package.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-5',
    name: 'Khaskhus Mukhwas',
    slug: 'khaskhus-mukhwas',
    description: 'Khaskhas Mukhwas is a premium and refreshing mouth freshener made with the natural goodness of poppy seeds, fennel, dry fruits, and a hint of menthol. This delicious blend offers a unique combination of mild sweetness, rich texture, and cooling freshness, making it an excellent choice after meals or whenever you need a refreshing treat. Carefully crafted with high-quality ingredients, Khaskhas Mukhwas delivers a delightful taste while promoting a pleasant and long-lasting freshness.',
    benefits:'Khaskhas Mukhwas provides a refreshing cooling sensation, helps freshen breath, supports healthy digestion after meals, promotes relaxation with its soothing ingredients, and offers a delicious blend of natural flavors and textures. It is an ideal everyday mouth freshener for lasting freshness and comfort.',
    ingredients:'Khaskhas Mukhwas is prepared using premium poppy seeds, sugar, fennel seeds, menthol, dry fruits, and natural flavoring to create its rich taste and refreshing aroma.',
    category: { id: 'c-sweet', name: 'Sweet Mukhwas', slug: 'sweet-mukhwas', isActive: true, sortOrder: 2 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-5', weightGrams: 100, label: '100 gm', retailPrice: 130, wholesalePrice: 73.5, moq: 10, stockQuantity: 500, sku: 'DM-KHK-100', isActive: true }
    ],
    images: [
      { id: 'img-5-1', imageUrl: '/products/sweet-mukhwas/khaskhas mukhwas.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-5-2', imageUrl: '/products/sweet-mukhwas/chocolate mukhwas.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-6',
    name: 'Chandan Mukhwas',
    slug: 'chandan-mukhwas',
    description: 'Chandan Mukhwas is a premium aromatic mouth freshener inspired by the soothing fragrance of sandalwood. Carefully prepared with fennel seeds, sugar, dry coconut, cardamom, and natural sandalwood essence, this refreshing blend offers a unique combination of sweetness, cooling freshness, and rich aroma. Its pleasant flavor and long-lasting fragrance make it a perfect choice after meals or whenever you want to refresh your breath and enjoy a calming taste',
    benefits:'Chandan Mukhwas provides a refreshing cooling sensation, freshens breath with its pleasant sandalwood aroma, supports healthy digestion after meals, offers a soothing and calming experience, and serves as a delicious everyday mouth freshener with long-lasting freshness.',
    ingredients:'Chandan Mukhwas is prepared using premium fennel seeds, sugar, sandalwood essence, dry coconut, cardamom, and natural flavoring to create its distinctive aroma and refreshing taste.',
    category: { id: 'c-sweet', name: 'Sweet Mukhwas', slug: 'sweet-mukhwas', isActive: true, sortOrder: 2 },
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 'v-6', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-CHD-100', isActive: true }
    ],
    images: [
      { id: 'img-6-1', imageUrl: '/products/sweet-mukhwas/Chandan Mukhwas.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-6-2', imageUrl: '/products/sweet-mukhwas/chandan package.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-7',
    name: 'Bambaiya Mukhwas',
    slug: 'bambaiya-mukhwas',
    description: 'Bambaiya Mukhwas is a flavorful and refreshing mouth freshener inspired by the vibrant taste of Mumbai. Expertly crafted with premium fennel seeds, sesame seeds, coriander seeds, sugar, and mint, this delightful blend offers a perfect balance of sweetness, crunch, and cooling freshness. Its unique Mumbai-style flavor makes it an ideal choice after meals or whenever you want a delicious and refreshing mouth freshener.',
    benefits:'Bambaiya Mukhwas helps support healthy digestion after meals, provides long-lasting freshness, freshens breath with its minty aroma, delivers the authentic Mumbai-style taste, and serves as a delicious everyday mouth freshener for all age groups.',
    ingredients:'Bambaiya Mukhwas is prepared using premium fennel seeds, sesame seeds, coriander seeds, sugar, mint, and natural flavoring to create its distinctive taste and refreshing aroma.',
    category: { id: 'c-sweet', name: 'Sweet Mukhwas', slug: 'sweet-mukhwas', isActive: true, sortOrder: 2 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-7', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-BAM-100', isActive: true }
    ],
    images: [
      { id: 'img-7-1', imageUrl: '/products/sweet-mukhwas/Bambaiya Mukhwas.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-7-2', imageUrl: '/products/sweet-mukhwas/Chandan Mukhwas.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-8',
    name: 'Madbasi Mukhwas',
    slug: 'madbasi-mukhwas',
    description: 'Madrasi Mukhwas is a refreshing and flavorful mouth freshener inspired by the rich culinary traditions of South India. Expertly crafted with premium fennel seeds, sesame seeds, coconut, sugar, and menthol, this delightful blend offers a perfect combination of sweetness, crunch, and cooling freshness. Its unique taste and pleasant aroma make it an ideal choice after meals or whenever you want a refreshing and satisfying mouth freshener.',
    benefits:'Madrasi Mukhwas provides long-lasting freshness, freshens breath with its pleasant aroma, supports healthy digestion after meals, offers a refreshing cooling sensation, and delivers a delicious South Indian-inspired flavor. It is an excellent everyday mouth freshener for a refreshing experience.',
    ingredients:'Madrasi Mukhwas is prepared using premium fennel seeds, sesame seeds, coconut, sugar, menthol, and natural flavoring to create its distinctive taste and refreshing aroma.',
    category: { id: 'c-sweet', name: 'Sweet Mukhwas', slug: 'sweet-mukhwas', isActive: true, sortOrder: 2 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-8', weightGrams: 100, label: '100 gm', retailPrice: 90, wholesalePrice: 42, moq: 10, stockQuantity: 500, sku: 'DM-MAD-100', isActive: true }
    ],
    images: [
      { id: 'img-8-1', imageUrl: '/products/sweet-mukhwas/Madrasi Mukhwas.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-8-2', imageUrl: '/products/sweet-mukhwas/Chandan Mukhwas.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },

  // === CHATPATA MUKHWAS ===
  {
    id: 'd-9',
    name: 'Tikhi Keri',
    slug: 'tikhi keri',
    description: 'Tikhi Keri is a delicious and tangy mouth freshener inspired by the bold flavors of raw mango. Made with carefully selected raw mango pieces, salt, chili powder, and asafoetida, this traditional blend delivers the perfect balance of spicy, tangy, and savory taste. Its irresistible flavor makes it an excellent choice for those who enjoy a zesty snack after meals or anytime they crave a burst of authentic Indian taste',
    benefits:'Tikhi Keri helps stimulate the appetite, supports healthy digestion, delivers a delicious tangy and spicy flavor, refreshes the palate, and provides an authentic traditional taste that can be enjoyed anytime.',
    ingredients:'Tikhi Keri is prepared using premium raw mango, salt, chili powder, asafoetida (hing), and natural flavoring to create its signature tangy and spicy taste.',
    category: { id: 'c-chatpata', name: 'Chatpata Mukhwas', slug: 'chatpata-mukhwas', isActive: true, sortOrder: 3 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-9', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-TLF-100', isActive: true }
    ],
    images: [
      { id: 'img-9-1', imageUrl: '/products/chatpata-mukhwas/Tikhi Keri.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-9-2', imageUrl: '/products/chatpata-mukhwas/TIkhi Keri package.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },

  // === DIGESTIVE MUKHWAS ===
  {
    id: 'd-10',
    name: 'Digestive Mukhwas',
    slug: 'digestive-mukhwas',
    description: 'Digestive Mukhwas is a traditional herbal mouth freshener specially crafted to support healthy digestion while delivering a refreshing taste. Made with premium ajwain, black salt, cumin, fennel, and white sesame seeds, this flavorful blend combines aromatic spices with natural ingredients to provide a satisfying and refreshing experience. Ideal after meals, Digestive Mukhwas helps freshen your breath while offering the goodness of time-tested digestive ingredients.',
    benefits:'Digestive Mukhwas supports healthy digestion, helps relieve gas and bloating after meals, freshens breath with its aromatic ingredients, promotes digestive comfort, and serves as a refreshing everyday mouth freshener with a traditional herbal taste.',
    ingredients:'Digestive Mukhwas is prepared using premium ajwain (carom seeds), black salt, cumin seeds, fennel seeds, white sesame seeds, and natural flavoring to create its distinctive taste and digestive benefits.',
    category: { id: 'c-digestive', name: 'Digestive Mukhwas', slug: 'digestive-mukhwas', isActive: true, sortOrder: 4 },
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 'v-10', weightGrams: 100, label: '100 gm', retailPrice: 130, wholesalePrice: 73.5, moq: 10, stockQuantity: 500, sku: 'DM-DIG-100', isActive: true }
    ],
    images: [
      { id: 'img-10-1', imageUrl: '/products/digestive-mukhwas/Digestive Mukhwas.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-10-2', imageUrl: '/products/digestive-mukhwas/Digestive Mukhwas.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },

  // === AMLA MUKHWAS ===
  {
    id: 'd-11',
    name: 'Honey Amla Candy',
    slug: 'honey-amla-candy',
    description: 'Honey Amla Candy is a delicious and nutritious treat made from premium-quality amla (Indian gooseberry), natural honey, and rock salt. This wholesome combination offers the perfect balance of sweet and tangy flavors while preserving the natural goodness of amla. Rich in antioxidants and vitamin C, Honey Amla Candy is an ideal healthy snack that can be enjoyed anytime for both taste and wellness.',
    benefits:'Honey Amla Candy is rich in natural vitamin C, helps support a healthy immune system, provides antioxidant benefits, supports healthy digestion, refreshes the palate, and offers a delicious and nutritious snack for all age groups.',
    ingredients:'Honey Amla Candy is prepared using premium amla (Indian gooseberry), natural honey, rock salt, and natural flavoring to deliver its distinctive sweet and tangy taste.',
    category: { id: 'c-amla', name: 'Amla Mukhwas', slug: 'amla-mukhwas', isActive: true, sortOrder: 5 },
    isFeatured: true,
    isActive: true,
    variants: [
      { id: 'v-11', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-HON-100', isActive: true }
    ],
    images: [
      { id: 'img-11-1', imageUrl: '/products/amla-mukhwas/Honey Amla Candy.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-11-2', imageUrl: '/products/amla-mukhwas/Amla package.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-12',
    name: 'Jeera Amla Candy',
    slug: 'jeera-amla-candy',
    description: 'Jeera Amla Candy is a flavorful and healthy treat made from premium-quality amla (Indian gooseberry), aromatic cumin, sugar, and black salt. This delicious combination blends the tangy taste of amla with the earthy flavor of cumin, creating a refreshing snack that is both tasty and nourishing. Rich in natural vitamin C and traditional digestive ingredients, Jeera Amla Candy is perfect for enjoying after meals or anytime you crave a healthy, tangy delight.',
    benefits:'Jeera Amla Candy is rich in natural vitamin C, helps support a healthy immune system, promotes healthy digestion, freshens the palate with its tangy flavor, and provides antioxidant benefits. It is a delicious and nutritious snack suitable for all age groups.',
    ingredients:'Jeera Amla Candy is prepared using premium amla (Indian gooseberry), cumin, sugar, black salt, and natural flavoring to deliver its unique tangy and savory taste',
    category: { id: 'c-amla', name: 'Amla Mukhwas', slug: 'amla-mukhwas', isActive: true, sortOrder: 5 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-12', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-JRA-100', isActive: true }
    ],
    images: [
      { id: 'img-12-1', imageUrl: '/products/amla-mukhwas/Jeera Amla Candy.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-12-2', imageUrl: '/products/amla-mukhwas/Jeera Amla package.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-13',
    name: 'Amla Pachak',
    slug: 'amla-pachak',
    description: 'Amla Candy is a delicious and wholesome snack made from premium-quality Indian gooseberries (amla), sugar, and a touch of salt. It perfectly balances sweet and tangy flavors while preserving the natural goodness of amla. Rich in essential nutrients and antioxidants, this refreshing candy is an ideal choice for a healthy snack that can be enjoyed anytime by people of all ages.',
    benefits:'Amla Candy is rich in natural vitamin C, helps support a healthy immune system, provides antioxidant benefits, supports healthy digestion, refreshes the palate, and serves as a delicious and nutritious snack for everyday enjoyment.',
    ingredients:'Amla Candy is prepared using premium amla (Indian gooseberry), sugar, salt, and natural flavoring to deliver its distinctive sweet and tangy taste.',
    category: { id: 'c-amla', name: 'Amla Mukhwas', slug: 'amla-mukhwas', isActive: true, sortOrder: 5 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-13', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-PCH-100', isActive: true }
    ],
    images: [
      { id: 'img-13-1', imageUrl: '/products/amla-mukhwas/Amla Pachak.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-13-2', imageUrl: '/products/amla-mukhwas/Amla package.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },

  // === OTHERS ===
  {
    id: 'd-14',
    name: 'Aam Papad',
    slug: 'aam-papad',
    description: 'Aam Papad is a classic Indian fruit delicacy made from premium mango pulp, sugar, salt, and citric acid. Bursting with the rich, natural sweetness and tangy flavor of ripe mangoes, this soft and chewy treat is loved by people of all ages. Carefully prepared to preserve the authentic taste of mango, Aam Papad is a delicious snack that can be enjoyed anytime as a refreshing and flavorful delight.',
    benefits:'Aam Papad is a good source of vitamins A and C, helps support a healthy immune system, provides antioxidant benefits, satisfies sweet cravings with natural mango goodness, and makes for a delicious and refreshing snack for all age groups.',
    ingredients:'Aam Papad is prepared using premium mango pulp, sugar, salt, citric acid, and natural flavoring to create its rich fruity taste and chewy texture.',
    category: { id: 'c-others', name: 'Others', slug: 'others', isActive: true, sortOrder: 6 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-14', weightGrams: 100, label: '100 gm', retailPrice: 140, wholesalePrice: 84, moq: 10, stockQuantity: 500, sku: 'DM-AAM-100', isActive: true }
    ],
    images: [
      { id: 'img-14-1', imageUrl: '/products/others/Aam Papad.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-14-2', imageUrl: '/products/others/Aam Papad.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-15',
    name: 'Imli Laddu',
    slug: 'imli-laddu',
    description: 'Imli Laddu is a traditional Indian delicacy made from premium tamarind, jaggery, sugar, black salt, and a blend of aromatic spices. This delicious treat perfectly combines tangy, sweet, and mildly spicy flavors to create an irresistible taste experience. Soft, chewy, and full of authentic Indian flavors, Imli Laddu is a delightful snack that can be enjoyed after meals or anytime you crave a refreshing and flavorful bite.',
    benefits:'Imli Laddu helps support healthy digestion, stimulates the appetite with its tangy flavor, refreshes the palate, provides a delightful balance of sweet and tangy taste, and makes for a delicious traditional snack that can be enjoyed by all age groups.',
    ingredients:'Imli Laddu is prepared using premium tamarind, jaggery, sugar, black salt, aromatic spices, and natural flavoring to create its signature sweet and tangy taste.',
    category: { id: 'c-others', name: 'Others', slug: 'others', isActive: true, sortOrder: 6 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-15', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-IML-100', isActive: true }
    ],
    images: [
      { id: 'img-15-1', imageUrl: '/products/others/imli laduu.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-15-2', imageUrl: '/products/others/lmli laddu.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'd-16',
    name: 'Mango Slice Mukhwas',
    slug: 'mango-slice-mukhwas',
    description: 'Mango Slice Mukhwas is a delicious and refreshing after-meal treat made from premium dried mango slices blended with sugar, citric acid, salt, black salt, and aromatic spices. This delightful combination offers the perfect balance of sweet, tangy, and mildly spicy flavors, making every bite a burst of authentic mango goodness. Its chewy texture and refreshing taste make it an ideal mouth freshener and snack for any time of the day.',
    benefits:'Mango Slice Mukhwas helps support healthy digestion after meals, refreshes the palate with its tangy-sweet flavor, is a good source of Vitamin C, provides antioxidant benefits, and makes for a delicious and refreshing snack suitable for all age groups.',
    ingredients:'Mango Slice Mukhwas is prepared using premium dried mango slices, sugar, citric acid, salt, black salt, aromatic spices, and natural flavoring to create its distinctive sweet and tangy taste.',
    category: { id: 'c-others', name: 'Others', slug: 'others', isActive: true, sortOrder: 6 },
    isFeatured: false,
    isActive: true,
    variants: [
      { id: 'v-16', weightGrams: 100, label: '100 gm', retailPrice: 120, wholesalePrice: 63, moq: 10, stockQuantity: 500, sku: 'DM-MNG-100', isActive: true }
    ],
    images: [
      { id: 'img-16-1', imageUrl: '/products/others/amngo slice mukhwas.jpeg', isPrimary: true, sortOrder: 0 },
      { id: 'img-16-2', imageUrl: '/products/others/amngo slice mukhwas.jpeg', isPrimary: false, sortOrder: 1 }
    ],
    createdAt: new Date().toISOString()
  }
]
