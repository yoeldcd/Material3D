var mediaAssets = [
    'beginGame.mp3',
    'desaffy.mp3',
    'security.mp3',
    'Intergalactic Odyssey.ogg',
    'inminentDisaster.mp3'
];

var componentsAssets = [
    'LevelAssets_1.obj'
];

var colorAssets = {
    blue: [0, 0, 0.2],
    orange: [0.8, 0.3, 0],
    darkBlue: [0.1, 0.0, 0.2]
};

var levels = [
    {
        name: 'TUTORIAL',
        backgroundColor: colorAssets.darkBlue,
        backgroundTrack: mediaAssets[2],
        sceneAssets: componentsAssets[0],
        //requiredEXP: 1000,
        requiredTime: 100,
        asteroidSpeed: 8,
        asteroidStrengh: 1000,
        gamingCycles: 3,
        seedsIndexs: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
            10
        ]
    }, 
    {
        name: 'BEGINING',
        backgroundColor: colorAssets.blue,
        backgroundTrack: mediaAssets[2],
        sceneAssets: componentsAssets[0],
        requiredEXP: 10000,
        asteroidSpeed: 10,
        asteroidStrengh: 2000,
        gamingCycles: 3,
        seedsIndexs: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
            10,11, 12, 15, 14, 13, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25
            //, 26, 27, 28, 29,30, 31, 32, 33
        ]
        
    }
];