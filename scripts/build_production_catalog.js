const fs = require('fs');
const path = require('path');

// Image pools by product category with authentic cosmetics photography
const IMAGES = {
  foundation: [
    'https://images.openbeautyfacts.org/images/products/360/053/132/4483/front_nl.13.400.jpg',
    'https://images.openbeautyfacts.org/images/products/081/665/702/2872/front_fr.5.400.jpg',
    'https://images.openbeautyfacts.org/images/products/360/052/359/1109/front_en.11.400.jpg',
    'https://images.openbeautyfacts.org/images/products/002/071/498/0871/front_en.4.400.jpg',
    'https://images.openbeautyfacts.org/images/products/354/875/216/8123/front_fr.10.400.jpg',
    'https://images.openbeautyfacts.org/images/products/080/089/715/7272/front_en.6.400.jpg',
    'https://images.openbeautyfacts.org/images/products/309/975/413/1841/front_en.12.400.jpg',
    'https://images.openbeautyfacts.org/images/products/337/887/215/6789/front_en.5.400.jpg',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
  ],
  concealer: [
    'https://images.openbeautyfacts.org/images/products/405/972/927/7084/front_en.6.400.jpg',
    'https://images.openbeautyfacts.org/images/products/071/748/970/0058/front_en.11.400.jpg',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583241800698-e8ab01830a07?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&auto=format&fit=crop&q=80',
  ],
  powder: [
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1608248597359-0a86617a2688?w=800&auto=format&fit=crop&q=80',
  ],
  bbcc: [
    'https://images.openbeautyfacts.org/images/products/060/933/282/8827/front_en.3.400.jpg',
    'https://images.openbeautyfacts.org/images/products/081/791/901/7106/front_en.5.400.jpg',
    'https://images.openbeautyfacts.org/images/products/400/580/874/5708/front_en.34.400.jpg',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
  ],
  primer: [
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
  ],
  cheek: [
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
  ]
};

// Skin tones and Undertones calibration profiles
const COMPLEXIONS = [
  { tone: 'Very Fair', undertone: 'Cool' },
  { tone: 'Very Fair', undertone: 'Neutral' },
  { tone: 'Fair', undertone: 'Warm' },
  { tone: 'Fair', undertone: 'Cool' },
  { tone: 'Fair', undertone: 'Neutral' },
  { tone: 'Light', undertone: 'Warm' },
  { tone: 'Light', undertone: 'Cool' },
  { tone: 'Light', undertone: 'Neutral' },
  { tone: 'Light', undertone: 'Olive' },
  { tone: 'Medium', undertone: 'Warm' },
  { tone: 'Medium', undertone: 'Warm' }, // Weighted higher for South Asian / global population
  { tone: 'Medium', undertone: 'Neutral' },
  { tone: 'Medium', undertone: 'Cool' },
  { tone: 'Medium', undertone: 'Olive' },
  { tone: 'Tan', undertone: 'Warm' },
  { tone: 'Tan', undertone: 'Warm' },
  { tone: 'Tan', undertone: 'Neutral' },
  { tone: 'Tan', undertone: 'Olive' },
  { tone: 'Deep', undertone: 'Warm' },
  { tone: 'Deep', undertone: 'Neutral' },
  { tone: 'Deep', undertone: 'Cool' },
];

console.log('Script loaded successfully.');
