var container, stats, scene, UIscene, camera, renderer, controls, clock, pickingMat;
var destroyCube, buildCube;
var stoneMat, sandMat, mossMat, tntMatArray;

function applyFaceColor(geom, color) {
  geom.faces.forEach(function(f) {
    f.color.setHex(color);
  });
}

//create a cube from a position and a material or a material array
function createCube(x, y, z, material) {
  var geometry = new THREE.BoxGeometry(1,1,1);
  cube = new THREE.Mesh(geometry, material);
  applyFaceColor(geometry, cube.id);
  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;
  return cube;
}

function loadTextures() {
  var loader = new THREE.TextureLoader();
  tntMat1 = new THREE.MeshBasicMaterial( {map:loader.load('textures/tnt1.png')});
  tntMat2 = new THREE.MeshBasicMaterial( {map:loader.load('textures/tnt2.png')});
  tntMatArray = [tntMat1,tntMat1,tntMat2,tntMat2,tntMat1,tntMat1];

  stoneMat = new THREE.MeshBasicMaterial( {map:loader.load('textures/stonebrick.png')});
  mossMat = new THREE.MeshBasicMaterial( {map:loader.load('textures/stonebrick_mossy.png')});
  sandMat = new THREE.MeshBasicMaterial( {map:loader.load('textures/sand.png')});
}

function createLevel() {
  var levelHalfLength = 9;
  // load the textures
  loadTextures();

  // create the level
  scene.add(createCube(0,0,0, tntMatArray));
  for (var i = -levelHalfLength; i <= levelHalfLength ; i++) {
    for (var j = -levelHalfLength; j <= levelHalfLength ; j++) {

      var randMatArray = new Array(6);
      for (var k = 0; k < randMatArray.length; k++) {
        var rand = Math.floor(Math.random() * 2);
        if (rand == 1)
          randMatArray[k] = stoneMat;
        else
          randMatArray[k] = mossMat;
      }
      scene.add(createCube(i, -1, j, randMatArray));
    }
  }
  for (var i = -levelHalfLength; i <= levelHalfLength  ; i++) {
    for (var j = -levelHalfLength; j <= levelHalfLength ; j++) {
      scene.add(createCube(i, -2, j, sandMat));
    }
  }
}

function crossHair() {
  // display the crosshair
  UIscene = new THREE.Scene();
  var lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
  var lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push(new THREE.Vector3(10, 0, 0));
  lineGeometry.vertices.push(new THREE.Vector3(-10, 0, 0));
  var line = new THREE.Line(lineGeometry, lineMaterial);
  UIscene.add(line);
  var lineGeometry2 = new THREE.Geometry();
  lineGeometry2.vertices.push(new THREE.Vector3(0, 10, 0));
  lineGeometry2.vertices.push(new THREE.Vector3(0, -10, 0));
  var line2 = new THREE.Line(lineGeometry2, lineMaterial);
  UIscene.add(line2);
}

function init() {

  width = window.innerWidth;
  height = window.innerHeight;

  velocity = new THREE.Vector3();
  clock = new THREE.Clock();
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  // stats
  stats = new Stats();
  container.appendChild( stats.dom );

  // setup the scene, camera and renderer for the app
  scene = new THREE.Scene();
  pickingScene = new THREE.Scene();
  pickingTexture = new THREE.WebGLRenderTarget( width, height );
  pickingMat = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors});

  crossHair();

  camera = new THREE.PerspectiveCamera( 75, width/height, 0.1, 1000 );
  orthoCam = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 0.1, 1000);
  orthoCam.position.z = 10;
  renderer = new THREE.WebGLRenderer();
  renderer.autoClear = false
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);

  // create the controls
  controls = new THREE.PointerLockControls( camera, renderer.domElement );
  controls.enabled = true;
  scene.add( controls.getObject() );

  createLevel();

  // handles the controls to move the camera
  moveForward = moveBackward = moveLeft = moveRight = false;

  document.addEventListener("keydown", function(e){
    if (e.keyCode == 83) {
      moveForward = true;
    }
    if (e.keyCode == 90) {
      moveBackward = true;
    }
    if (e.keyCode == 68) {
      moveLeft = true;
    }
    if (e.keyCode == 81) {
      moveRight = true;
    }
  });

  document.addEventListener("keyup", function(e){
    if (e.keyCode == 83) {
      moveForward = false;
    }
    if (e.keyCode == 90) {
      moveBackward = false;
    }
    if (e.keyCode == 68) {
      moveLeft = false;
    }
    if (e.keyCode == 81) {
      moveRight = false;
    }
  });

  // handles the mouse clicks
  document.addEventListener( 'mouseup', function(e) {
		switch ( e.button ) {
			case 1: // middle
      buildCube = true;
			break;
			case 2: // right
      destroyCube = true;
			break;
		}
  }, false );

}


function pick() {
  //create buffer for reading single pixel
  pixelBuffer = new Uint8Array(4);
  scene.overrideMaterial = pickingMat;
  renderer.render( scene, camera, pickingTexture, true );
  //read the pixel under the mouse from the texture
  renderer.readRenderTargetPixels(pickingTexture, width/2, height/2, 1, 1, pixelBuffer);
  id = ( pixelBuffer[0] << 16 ) | ( pixelBuffer[1] << 8 ) | ( pixelBuffer[2] );
  var cubeFound = scene.getObjectById(id, true);
  scene.overrideMaterial = null;

  if (destroyCube) {
    destroyCube = false;
    if (cubeFound != null)
    scene.remove(cubeFound);
  }
  if (buildCube) {
    buildCube = false;
    // creates a cube just above the selected cube
    if (cubeFound != null) {
    scene.add(createCube(cubeFound.position.x, cubeFound.position.y+1, cubeFound.position.z, stoneMat));
    }
  }

}

function animate() {

  stats.update();

  var delta = clock.getDelta();
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  if ( moveForward ) velocity.z += 40.0 * delta;
  if ( moveBackward ) velocity.z -= 40.0 * delta;
  if ( moveLeft ) velocity.x += 40.0 * delta;
  if ( moveRight ) velocity.x -= 40.0 * delta;

  controls.getObject().translateX( velocity.x * delta );
	controls.getObject().translateZ( velocity.z * delta );

  controls.getObject().rotation;
  requestAnimationFrame(animate);
  renderer.clear();
  if (destroyCube || buildCube) {
    pick();
  }
  renderer.render(scene, camera);
  renderer.clearDepth();
  renderer.render(UIscene, orthoCam);
}
