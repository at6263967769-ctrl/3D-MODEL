// We'll replace the Wikipedia links with procedural or reliable static URLs to avoid 404s/CORS issues

const PLANET_DATA = [
    {
        id: 'mercury',
        name: 'Mercury',
        type: 'Terrestrial Planet',
        description: 'The smallest planet in our solar system and nearest to the Sun, Mercury is only slightly larger than Earth\'s Moon. It has no atmosphere to retain heat, resulting in massive temperature fluctuations.',
        diameter: '4,879 km',
        gravity: '3.7 m/s²',
        distance: '0.39 AU',
        moons: '0',
        color: 0x8c8c8c, // Grayish
        textureUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png', // fallback
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg',
        3: {
            radius: 1,
            distance: 12,
            orbitSpeed: 0.04,
            rotationSpeed: 0.01,
            orbitalTilt: 0.12,
        }
    },
    {
        id: 'venus',
        name: 'Venus',
        type: 'Terrestrial Planet',
        description: 'Often called Earth\'s twin because they\'re similar in size and structure, but Venus has extreme surface heat and a dense, toxic atmosphere. It spins forwards in retrograde, unlike most planets.',
        diameter: '12,104 km',
        gravity: '8.87 m/s²',
        distance: '0.72 AU',
        moons: '0',
        color: 0xe3bb76, // Yellowish
        textureUrl: null, // Let it use the color and material roughness to simulate atmosphere
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg',
        3: {
            radius: 1.5,
            distance: 18,
            orbitSpeed: 0.015,
            rotationSpeed: -0.005,
            orbitalTilt: 0.06,
        }
    },
    {
        id: 'earth',
        name: 'Earth',
        type: 'Terrestrial Planet',
        description: 'Our home planet is the only place we know of so far that\'s inhabited by living things. It\'s also the only planet in our solar system with liquid water on the surface.',
        diameter: '12,742 km',
        gravity: '9.80 m/s²',
        distance: '1.00 AU',
        moons: '1',
        color: 0x2b82c9,
        textureUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        bumpUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg',
        3: {
            radius: 1.6,
            distance: 25,
            orbitSpeed: 0.01,
            rotationSpeed: 0.02,
            orbitalTilt: 0,
        }
    },
    {
        id: 'mars',
        name: 'Mars',
        type: 'Terrestrial Planet',
        description: 'Mars is a dusty, cold, desert world with a very thin atmosphere. There is strong evidence Mars was – billions of years ago – wetter and warmer, with a thicker atmosphere.',
        diameter: '6,779 km',
        gravity: '3.72 m/s²',
        distance: '1.52 AU',
        moons: '2',
        color: 0xc1440e,
        textureUrl: 'https://unpkg.com/three-globe/example/img/earth-topology.png', // Red tinted topology works well for Mars
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg',
        3: {
            radius: 1.2,
            distance: 33,
            orbitSpeed: 0.008,
            rotationSpeed: 0.018,
            orbitalTilt: 0.03,
        }
    },
    {
        id: 'jupiter',
        name: 'Jupiter',
        type: 'Gas Giant',
        description: 'Jupiter is more than twice as massive as the other planets of our solar system combined. The giant planet\'s Great Red Spot is a centuries-old storm bigger than Earth.',
        diameter: '139,820 km',
        gravity: '24.79 m/s²',
        distance: '5.20 AU',
        moons: '95',
        color: 0xc88b3a,
        textureUrl: null, // Colors are often sufficient when textures fail
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg',
        3: {
            radius: 3.5,
            distance: 45,
            orbitSpeed: 0.002,
            rotationSpeed: 0.04,
            orbitalTilt: 0.02,
        }
    },
    {
        id: 'saturn',
        name: 'Saturn',
        type: 'Gas Giant',
        description: 'Adorned with a dazzling, complex system of icy rings, Saturn is unique in our solar system. The other giant planets have rings, but none are as spectacular as Saturn\'s.',
        diameter: '116,460 km',
        gravity: '10.44 m/s²',
        distance: '9.58 AU',
        moons: '146',
        color: 0xe4cd95,
        textureUrl: null,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
        3: {
            radius: 3.0,
            distance: 58,
            orbitSpeed: 0.0009,
            rotationSpeed: 0.038,
            orbitalTilt: 0.04,
            hasRings: true,
            ringInner: 3.5,
            ringOuter: 5.5,
            ringColor: 0xcfaf88
        }
    },
    {
        id: 'uranus',
        name: 'Uranus',
        type: 'Ice Giant',
        description: 'Uranus is the seventh planet from the Sun, and has the third-largest diameter. It rotates at a nearly 90-degree angle from the plane of its orbit.',
        diameter: '50,724 km',
        gravity: '8.69 m/s²',
        distance: '19.18 AU',
        moons: '28',
        color: 0x4b70dd,
        textureUrl: null,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg',
        3: {
            radius: 2.2,
            distance: 72,
            orbitSpeed: 0.0004,
            rotationSpeed: 0.03,
            orbitalTilt: 1.57, // 90 degrees
            hasRings: true,
            ringInner: 2.8,
            ringOuter: 3.0,
            ringColor: 0x99badd
        }
    },
    {
        id: 'neptune',
        name: 'Neptune',
        type: 'Ice Giant',
        description: 'Dark, cold, and whipped by supersonic winds, ice giant Neptune is the eighth and most distant planet in our solar system. It was the first planet located through mathematical calculations.',
        diameter: '49,244 km',
        gravity: '11.15 m/s²',
        distance: '30.07 AU',
        moons: '16',
        color: 0x274687,
        textureUrl: null,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Neptune_Voyager2_color_calibrated.png',
        3: {
            radius: 2.1,
            distance: 85,
            orbitSpeed: 0.0001,
            rotationSpeed: 0.032,
            orbitalTilt: 0.03,
        }
    }
];

const SUN_DATA = {
    id: 'sun',
    name: 'The Sun',
    description: 'The heart of our solar system, the Sun is a yellow dwarf star. Its gravity holds the solar system together, keeping everything from the biggest planets to the smallest debris in its orbit.',
    color: 0xffcc00, 
    textureUrl: 'https://textures.starlight-citizens.net/textures/sun/sun_diffuse.jpg', // realistic sun
    3: {
        radius: 6,
    }
};
