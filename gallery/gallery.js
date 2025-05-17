import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Set up the scene, camera, and renderer
console.log('Initializing 3D gallery...');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
console.log('Renderer initialized and added to DOM');

// Set up controls
try {
    const controls = new PointerLockControls(camera, document.body);
    console.log('PointerLockControls initialized successfully');
    
    // Click to lock controls
    document.addEventListener('click', function() {
        controls.lock();
        console.log('Controls locked');
    });
    
    // Set initial camera position
    camera.position.y = 2.0; // Increased from 1.6 to 2.0 for a higher viewpoint
    camera.position.z = 5;
    
    // Create corridor dimensions
    const corridorLength = 30;
    const corridorWidth = 5;
    const corridorHeight = 4;
    const wallThickness = 0.1;
    
    // Materials
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5DC, roughness: 0.5 });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.7 });
    
    // Create floor
    const floorGeometry = new THREE.BoxGeometry(corridorWidth, wallThickness, corridorLength);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -wallThickness/2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create ceiling
    const ceilingGeometry = new THREE.BoxGeometry(corridorWidth, wallThickness, corridorLength);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = corridorHeight + wallThickness/2;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    
    // Create walls
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, corridorHeight, corridorLength);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -corridorWidth/2;
    leftWall.position.y = corridorHeight/2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(wallThickness, corridorHeight, corridorLength);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.x = corridorWidth/2;
    rightWall.position.y = corridorHeight/2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    
    // End wall
    const endWallGeometry = new THREE.BoxGeometry(corridorWidth, corridorHeight, wallThickness);
    const endWall = new THREE.Mesh(endWallGeometry, wallMaterial);
    endWall.position.z = -corridorLength/2;
    endWall.position.y = corridorHeight/2;
    endWall.receiveShadow = true;
    scene.add(endWall);
    
    // Start wall
    const startWallGeometry = new THREE.BoxGeometry(corridorWidth, corridorHeight, wallThickness);
    const startWall = new THREE.Mesh(startWallGeometry, wallMaterial);
    startWall.position.z = corridorLength/2;
    startWall.position.y = corridorHeight/2;
    startWall.receiveShadow = true;
    scene.add(startWall);
    
    // Add paintings to the walls
    const frameWidth = 1.2;
    const frameHeight = 1.6;
    const frameDepth = 0.05;
    const frameThickness = 0.1;
    const paintingOffset = 0.01; // Offset from the wall
    
    // Function to create a framed painting
    function createFramedPainting(imagePath, position, rotation) {
        // Create frame
        const outerFrameGeometry = new THREE.BoxGeometry(frameWidth + frameThickness*2, frameHeight + frameThickness*2, frameDepth);
        const innerFrameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth + 0.01);
        
        const frame = new THREE.Mesh(outerFrameGeometry, frameMaterial);
        frame.position.set(position.x, position.y, position.z);
        frame.rotation.set(rotation.x, rotation.y, rotation.z);
        frame.castShadow = true;
        scene.add(frame);
        
        // Create painting texture
        const textureLoader = new THREE.TextureLoader();
        try {
            const paintingTexture = textureLoader.load(imagePath, 
                // onLoad callback
                function() {
                    console.log('Texture loaded successfully: ' + imagePath);
                },
                // onProgress callback
                undefined,
                // onError callback
                function(err) {
                    console.error('Error loading texture: ' + imagePath, err);
                }
            );
            const paintingMaterial = new THREE.MeshStandardMaterial({ map: paintingTexture });
            
            // Create painting
            const painting = new THREE.Mesh(innerFrameGeometry, paintingMaterial);
            painting.position.set(position.x, position.y, position.z);
            painting.rotation.set(rotation.x, rotation.y, rotation.z);
            scene.add(painting);
            
            return { frame, painting };
        } catch (error) {
            console.error('Error in createFramedPainting:', error);
            // Return just the frame if texture loading fails
            return { frame, painting: null };
        }
    }
    
    // Texture pool manager
    const texturePool = {
        textures: new Map(),
        loader: new THREE.TextureLoader(),
        maxActiveTextures: 8, // Keep well under WebGL limit of 16
        loadQueue: [],
        activeLoads: 0,

        loadTexture(imagePath) {
            if (this.textures.has(imagePath)) {
                return this.textures.get(imagePath);
            }

            if (this.activeLoads >= this.maxActiveTextures) {
                // Queue the load request
                return new Promise((resolve) => {
                    this.loadQueue.push({ imagePath, resolve });
                });
            }

            this.activeLoads++;
            return new Promise((resolve) => {
                this.loader.load(imagePath,
                    (texture) => {
                        this.textures.set(imagePath, texture);
                        this.activeLoads--;
                        resolve(texture);
                        this.processQueue();
                    },
                    undefined,
                    (err) => {
                        console.error('Error loading texture: ' + imagePath, err);
                        this.activeLoads--;
                        resolve(null);
                        this.processQueue();
                    }
                );
            });
        },

        processQueue() {
            if (this.loadQueue.length > 0 && this.activeLoads < this.maxActiveTextures) {
                const next = this.loadQueue.shift();
                this.loadTexture(next.imagePath).then(next.resolve);
            }
        }
    };

    // Modified createFramedPainting to use texture pool
    async function createFramedPaintingAsync(imagePath, position, rotation) {
        try {
            const texture = await texturePool.loadTexture(imagePath);
            if (texture) {
                // Calculate aspect ratio and adjust frame width
                const aspectRatio = texture.image.width / texture.image.height;
                const dynamicFrameWidth = frameHeight * aspectRatio;
                
                // Create frame with dynamic width
                const outerFrameGeometry = new THREE.BoxGeometry(dynamicFrameWidth + frameThickness*2, frameHeight + frameThickness*2, frameDepth);
                const innerFrameGeometry = new THREE.BoxGeometry(dynamicFrameWidth, frameHeight, frameDepth + 0.01);
                
                const frame = new THREE.Mesh(outerFrameGeometry, frameMaterial);
                frame.position.set(position.x, position.y, position.z);
                frame.rotation.set(rotation.x, rotation.y, rotation.z);
                frame.castShadow = true;
                scene.add(frame);
    
                const paintingMaterial = new THREE.MeshStandardMaterial({ map: texture });
                const painting = new THREE.Mesh(innerFrameGeometry, paintingMaterial);
                painting.position.set(position.x, position.y, position.z);
                painting.rotation.set(rotation.x, rotation.y, rotation.z);
                scene.add(painting);
                return { frame, painting };
            }
        } catch (error) {
            console.error('Error in createFramedPainting:', error);
        }
        // If texture loading fails, create a default-sized frame
        const outerFrameGeometry = new THREE.BoxGeometry(frameWidth + frameThickness*2, frameHeight + frameThickness*2, frameDepth);
        const frame = new THREE.Mesh(outerFrameGeometry, frameMaterial);
        frame.position.set(position.x, position.y, position.z);
        frame.rotation.set(rotation.x, rotation.y, rotation.z);
        frame.castShadow = true;
        scene.add(frame);
        return { frame, painting: null };
    }

    // Add paintings to left wall
    console.log('Adding paintings to left wall...');
    const leftWallPaintings = [];
    const rightWallPaintings = [];

    // Create all paintings asynchronously
    async function createAllPaintings() {
        const paintingPromises = [];
        const imageFiles = [];

        
        try {
            // Get all image files from the images directory
            // const response = await fetch('images/');
            // const text = await response.text();
            // const parser = new DOMParser();
            // const doc = parser.parseFromString(text, 'text/html');
            // const links = doc.querySelectorAll('a');
            
            // links.forEach(link => {
            //     const fileName = link.getAttribute('href');
            //     if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            //         imageFiles.push(`images/${fileName}`);
            //     }
            // });

            // Hardcoded list of image files
            const imageFileNames = [
                'Blossoming Almond Tree, 1890 Vincent van Gogh (1853-1890).jpg',
                'Composition 8, 1923 Wassily Kandinsky (1866-1944).jpg',
                'Irises, 1889 Vincent van Gogh (1853-1890).jpg',
                'Liberty Leading the People, 1830 Eugene Delacroix (1798-1863).jpg',
                'Mona Lisa (La Gioconda), c.1503-06 Leonardo da Vinci (1452-1519).jpg',
                'Napoleon Crossing the Alps on 20th May 1800, 1803 Jacques-Louis David (1748-1825).jpg',
                'Starry Night, 1889 Vincent van Gogh (1853-1890).jpg',
                'Storm on the Sea of Galilee, 1633 van Rijn Rembrandt (1606-1669).jpg',
                'The Girl with a Pearl Earring, c.1665-66 Johannes Vermeer, van Delft (1632-1675).jpg',
                'The Kiss, c.1907 08 Gustav Klimt (1862-1918).jpg',
                'The Skiff (La Yole), 1875 Pierre-Auguste Renoir (1841-1919).jpg',
                'The Swing, 1767 Jean-Honore Fragonard (1732-1806).jpg',
                'Two Sisters (On the Terrace), 1881 Pierre-Auguste Renoir (1841-1919).jpg',
                'Water Lily Pond, (Symphony in Green), 1899 Claude Monet (1840-1926).jpg',
                'sun flower.jpg'
            ];

            // Add full path to each image
            imageFileNames.forEach(fileName => {
                imageFiles.push(`images/${fileName}`);
            });

            console.log(`Found ${imageFiles.length} image files`);

            // Calculate spacing based on number of images
            const imagesPerWall = Math.ceil(imageFiles.length / 2);
            const spacing = (corridorLength - 6) / (imagesPerWall - 1);

            // Left wall paintings
            for (let i = 0; i < imagesPerWall && i < imageFiles.length; i++) {
                const zPosition = -corridorLength/2 + 3 + i * spacing;
                const position = {
                    x: -corridorWidth/2 + wallThickness/2 + frameDepth/2 + paintingOffset,
                    y: corridorHeight/2,
                    z: zPosition
                };
                const rotation = { x: 0, y: Math.PI/2, z: 0 };
                paintingPromises.push(
                    createFramedPaintingAsync(imageFiles[i], position, rotation)
                        .then(painting => leftWallPaintings.push(painting))
                );
            }

            // Right wall paintings
            for (let i = 0; i < imagesPerWall && i + imagesPerWall < imageFiles.length; i++) {
                const zPosition = -corridorLength/2 + 3 + i * spacing;
                const position = {
                    x: corridorWidth/2 - wallThickness/2 - frameDepth/2 - paintingOffset,
                    y: corridorHeight/2,
                    z: zPosition
                };
                const rotation = { x: 0, y: -Math.PI/2, z: 0 };
                paintingPromises.push(
                    createFramedPaintingAsync(imageFiles[i + imagesPerWall], position, rotation)
                        .then(painting => rightWallPaintings.push(painting))
                );
            }

            await Promise.all(paintingPromises);
            console.log('All paintings loaded successfully');
        } catch (error) {
            console.error('Error loading images directory:', error);
        }
    }

    // Initialize paintings
    createAllPaintings();
    
    // Add lighting
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    // Spotlights for each painting
    function createSpotlight(position, targetPosition) {
        const spotlight = new THREE.SpotLight(0xffffff, 0.8);
        spotlight.position.set(position.x, position.y, position.z);
        spotlight.target.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
        spotlight.angle = Math.PI / 6;
        spotlight.penumbra = 0.2;
        spotlight.decay = 1.5;
        spotlight.distance = 10;
        spotlight.castShadow = true;
        spotlight.shadow.mapSize.width = 1024;
        spotlight.shadow.mapSize.height = 1024;
        scene.add(spotlight);
        scene.add(spotlight.target);
        return spotlight;
    }
    
    // Add spotlights for left wall paintings
    const leftSpotlights = [];
    for (let i = 0; i < leftWallPaintings.length; i++) {
        const painting = leftWallPaintings[i];
        const spotlightPosition = {
            x: painting.painting.position.x + 0.5,
            y: corridorHeight - 0.5,
            z: painting.painting.position.z
        };
        const targetPosition = {
            x: painting.painting.position.x,
            y: painting.painting.position.y,
            z: painting.painting.position.z
        };
        leftSpotlights.push(createSpotlight(spotlightPosition, targetPosition));
    }
    
    // Add spotlights for right wall paintings
    const rightSpotlights = [];
    for (let i = 0; i < rightWallPaintings.length; i++) {
        const painting = rightWallPaintings[i];
        const spotlightPosition = {
            x: painting.painting.position.x - 0.5,
            y: corridorHeight - 0.5,
            z: painting.painting.position.z
        };
        const targetPosition = {
            x: painting.painting.position.x,
            y: painting.painting.position.y,
            z: painting.painting.position.z
        };
        rightSpotlights.push(createSpotlight(spotlightPosition, targetPosition));
    }
    
    // Add ceiling lights
    for (let i = 0; i < 10; i++) {
        const light = new THREE.PointLight(0xffffff, 0.3);
        light.position.set(0, corridorHeight - 0.1, -corridorLength/2 + 3 + i * 3);
        light.castShadow = true;
        scene.add(light);
        
        // Add a simple light fixture
        const lightFixtureGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const lightFixtureMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, emissive: 0xffffee, emissiveIntensity: 0.5 });
        const lightFixture = new THREE.Mesh(lightFixtureGeometry, lightFixtureMaterial);
        lightFixture.position.copy(light.position);
        scene.add(lightFixture);
    }
    
    // Movement controls
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let moveUp = false;
    let moveDown = false;
    
    const onKeyDown = function(event) {
        switch(event.code) {
            case 'KeyW':
                moveForward = true;
                break;
            case 'KeyA':
                moveLeft = true;
                break;
            case 'KeyS':
                moveBackward = true;
                break;
            case 'KeyD':
                moveRight = true;
                break;
            case 'ArrowUp':
                moveUp = true;
                break;
            case 'ArrowDown':
                moveDown = true;
                break;
        }
    };
    
    const onKeyUp = function(event) {
        switch(event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
            case 'ArrowUp':
                moveUp = false;
                break;
            case 'ArrowDown':
                moveDown = false;
                break;
        }
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Movement speed and collision detection
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    let prevTime = performance.now();
    
    // Collision boundaries
    const minX = -corridorWidth/2 + 0.5;
    const maxX = corridorWidth/2 - 0.5;
    const minZ = -corridorLength/2 + 0.5;
    const maxZ = corridorLength/2 - 0.5;
    const minY = 1.0; // Minimum height
    const maxY = corridorHeight - 0.5; // Maximum height
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        if (controls.isLocked) {
            const time = performance.now();
            const delta = (time - prevTime) / 1000;
            
            velocity.x = 0;
            velocity.z = 0;
            
            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();
            
            if (moveForward || moveBackward) velocity.z -= direction.z * 2.0 * delta;
            if (moveLeft || moveRight) velocity.x -= direction.x * 2.0 * delta;
            if (moveUp) camera.position.y = Math.min(camera.position.y + 2.0 * delta, maxY);
            if (moveDown) camera.position.y = Math.max(camera.position.y - 2.0 * delta, minY);
            
            controls.moveRight(-velocity.x);
            controls.moveForward(-velocity.z);
            
            // Apply collision boundaries
            if (camera.position.x < minX) camera.position.x = minX;
            if (camera.position.x > maxX) camera.position.x = maxX;
            if (camera.position.z < minZ) camera.position.z = minZ;
            if (camera.position.z > maxZ) camera.position.z = maxZ;
            
            prevTime = time;
        }
        
        renderer.render(scene, camera);
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });    
    animate();
} catch (error) {
    console.error('Error initializing gallery:', error);
}
