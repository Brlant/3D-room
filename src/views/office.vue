<template>
  <div class="home">
    <div class="bigScreen">
      <div class="header">
        <div style="margin-top:0.5rem">室内定位</div>
      </div>
      <div class="main">
        <div class="left" @click="overAllView">
          <img class="icon" src="../assets/icon/panorama_360_2023_0423.png" alt="">
          <div>全景巡航</div>
        </div>

        <div class="right" @click="switchView">
          <img class="icon" src="../assets/icon/build_2023_0423.png" alt="">
          <div>视觉切换</div>
        </div>
      </div>
    </div>
    <div class="canvas-container" ref="canvasDom"></div>
    <div id="jindu-text-con">
      正在加载模型:<span id="jindu-text"></span>
      <div class="jindu-con">
        <div id="jindu"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as Three from "three";
import {TWEEN} from "../plugins/libs/tween.module.min";
import {nextTick, onMounted, reactive, ref,computed} from "vue";
import {useRoute} from 'vue-router';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {CSS3DObject} from 'three/examples/jsm/renderers/CSS3DRenderer';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {CSS3DRenderer} from "three/examples/jsm/renderers/CSS3DRenderer";
import Stats from "three/examples/jsm/libs/stats.module.js";
let stats = new Stats();
let route = useRoute();
let controls;
let officeWall;
let officeRoof;
let websocket;
let loadingProgress;
let info;
let objects = [];
let models = {}; // 存放模型
let model;
let modelTag;
let cssRender;
let texture;
let backWall;
let overAllFlag = ref(true)
let switchFlag = ref(true)
let canvasDom = ref(null);
let scene = new Three.Scene();
let camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let loader = new GLTFLoader();
let dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/gltf/");
loader.setDRACOLoader(dracoLoader);


let id = computed(() => route.query.id)


/**
 * 初始化相机事件
 * 控制相机的观看方向
 * **/
const initCamera = () => {
  camera.position.set(0, 2.1, 0);
  camera.lookAt(0, 1.5, 0)
}

/**
 *创建websocket心跳机制事件
 * **/
websocket = new WebSocket(import.meta.env.VITE_API_BASE_WS_PATH+`/ws/office3d`, [id.value]);
websocket.addEventListener('open', (event) => {
  console.log('WebSocket connect success')
})
websocket.addEventListener('error', (event) => {
  console.log('WebSocket connect error')
})
websocket.addEventListener('message', (event) => {
  if (event.data === 'success') {
    return
  }
  const data = JSON.parse(event.data)
  if(!data){
    return
  }
  // 获取设备id
  let ccsDevId = data.ccsDevId
  // 检查对应模型是否创建
  let currModel = models[ccsDevId]
  if(!currModel){
    // 如果模型不存在，那就创建模型
    const geometry = new Three.BoxGeometry(0.05, 0.05, 0.05);
    const map = createCanvasTags(data)
    const material = new Three.MeshBasicMaterial({map:map})
    currModel = new Three.Mesh(geometry, material)
    currModel.rotation.y = Math.PI
    currModel.position.set(data.smoothedPositionX, data.smoothedPositionY, data.smoothedPositionZ)
    modelTag = createModelTag(currModel,data)


    const label = createLabel(data.pointName);
    label.position.y = 0.06; // 标签在物体上方一定距离

    // console.log('标签：',label)

    // currModel.add(label);

    modelTag.rotation.y = Math.PI
    modelTag.visible = true;
    // 添加模型
    models[ccsDevId] = currModel
    scene.add(currModel);
  }
  let move = currModel.position.x !==data.smoothedPositionX || currModel.position.y !== data.smoothedPositionY || currModel.position.z !== data.smoothedPositionZ
  if (move){
    // 如果坐标发生变化，那么走动画
    let tweenTarget = new TWEEN.Tween(currModel.position)
    tweenTarget.to({
      x: data.smoothedPositionX,
      y: data.smoothedPositionY,
      z: data.smoothedPositionZ
    }, 100)
    tweenTarget.easing(TWEEN.Easing.Quadratic.Out)
    tweenTarget.onUpdate(() => {
    })
    tweenTarget.start();
    // 移动后更新当前坐标
    models[ccsDevId] = currModel
  }
})


/**
 * 创建人物3D标签
 * **/
const createModelTag = (model,objectData) => {
  const element = document.createElement('div')
  element.className = "elementTag"
  element.innerHTML = `
              <div class="elementContent">
                <div class="name">${objectData.devName}</div>
              </div>
        `
  const css3dRender = new CSS3DObject(element)
  css3dRender.scale.set(0.001, 0.001, 0.001)
  css3dRender.position.copy(model.position)
  return css3dRender
}


// 创建标签的函数
const createLabel =(text)=> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = '28px Arial';
  const width = context.measureText(text).width;

  canvas.width = width;
  canvas.height = 20;

  context.fillStyle = '#000000';
  context.globalAlpha = 0.6;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#ffffff';
  context.textAlign = "center";
  context.textBaseline = "middle";
  const x = canvas.width / 2;
  const y = canvas.height / 1.8;
  context.fillText(text, x, y);

  const texture = new Three.CanvasTexture(canvas);
  const material = new Three.SpriteMaterial({ map: texture });
  const sprite = new Three.Sprite(material);

  sprite.scale.set(0.15, 0.07, 0.07); // 标签的比例
  return sprite;
}

/**
 * 创建内置图片
 * **/
const createCanvasTags = (objectData)=>{
  // 初始化对象
  let obj = {
    name: '未标识',
    color: ''
  };
  if(objectData){
    obj.name = objectData.pointName || '待标识'
    obj.color = objectData.color
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 100;
  canvas.height = 50;
  // 设置背景为黑色透明
  ctx.fillStyle = obj.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 设置字体样式
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(`${obj.name}`, canvas.width / 2, canvas.height / 2);
  const dataURL = canvas.toDataURL('image/png');
  const img = new Image();
  img.src = dataURL;
  texture = new Three.Texture(img);
  texture.needsUpdate = true; //注意这句不能少
  return texture
}

/**
 * 模型旋转
 * */
const overAllView = () => {
  if (overAllFlag.value) {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 3;
    overAllFlag.value = false
  } else {
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0;
    overAllFlag.value = true;
  }
}

/**
 * 视觉切换
 * **/
const switchView = () => {
  if (switchFlag.value) {
    const targetPosition = new Three.Vector3(0, 0.9, -2.3);
    let tween = new TWEEN.Tween(camera.position)
        .to({x: targetPosition.x, y: targetPosition.y, z: targetPosition.z}, 6000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          camera.lookAt(0, 0.5, 0);
        })
        .onComplete(() => {
          controls.autoRotate = false;
          controls.autoRotateSpeed = 0;
          overAllFlag.value = true;
          initRoof()
        })
        .start();
    switchFlag.value = false
  } else {
    const targetCamera = new Three.Vector3(0, 2.1, 0);
    officeRoof.visible = false;
    let tweenCamera = new TWEEN.Tween(camera.position)
        .to({x: targetCamera.x, y: targetCamera.y, z: targetCamera.z}, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          camera.lookAt(0, 0.5, 0);
        })
        .onComplete(() => {
          controls.autoRotate = false;
          controls.autoRotateSpeed = 0;
          overAllFlag.value = true;
        })
        .start();
    switchFlag.value = true
  }
}

// 添加gltf房顶模型
const initRoof = () => {
  loader.load('./assets/roof_20230425_01.glb', gltf => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0.3
      }
    })
    officeRoof = gltf.scene;
    officeRoof.position.set(0, 0.32, 0)
    scene.add(officeRoof);
  })
}

/**
 * 添加渲染器
 * 设置渲染器基本属性
 * **/
const renderer = new Three.WebGLRenderer({
  antialias: true,
  logarithmicDepthBuffer: true,
  physicallyCorrectLights: true
});
renderer.shadowMap.type = Three.PCFSoftShadowMap;
renderer.toneMapping = Three.ACESFilmicToneMapping
renderer.sortObjects = true;
renderer.toneMappingExposure = 0.8
renderer.setSize(window.innerWidth, window.innerHeight);
cssRender = new CSS3DRenderer()
cssRender.setSize(window.innerWidth, window.innerHeight)
document.querySelector('#css3dRender').appendChild(cssRender.domElement)

/**
 * 渲染器的动画设置
 * 控制渲染器的基本属性
 * **/
const render = () => {
  TWEEN.update();
  stats.update();
  renderer.render(scene, camera);
  controls && controls.update();
  cssRender.render(scene,camera)
  requestAnimationFrame(render);
};
requestAnimationFrame(render);

/**
 * 增加控制器的事件
 * 控制鼠标的动态
 * **/
const initControls = () => {
  canvasDom.value.appendChild(renderer.domElement);
  // 添加控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true
  controls.maxPolarAngle = Math.PI / 2
  controls.minPolarAngle = 0
  controls.minDistance = 0.4;
  controls.maxDistance = 3;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0;
  controls.target.set(0, 0.5, 0);
  controls.update();
}

/**
 * 初始化模型展示
 * **/
const initModelFile = () => {
  let jindu_text_con = document.getElementById('jindu-text-con');
  let jindu_text = document.getElementById('jindu-text');
  let jindu = document.getElementById('jindu');
  // 添加办公室模型文件
  loader.load("./assets/office_20230508_build.glb", (gltf) => {
    officeWall = gltf.scene;
    scene.add(officeWall);
  }, (xhr) => {
    loadingProgress = xhr.loaded / xhr.total * 100;
    jindu_text.innerText = loadingProgress + '%';
    jindu.style.width = loadingProgress + '%'
    if (loadingProgress === 100) {
      jindu_text_con.style.display = 'none'
    }
  }, (error) => {
    jindu_text_con.style.display = 'block'
  });
}

/**
 * 添加门窗模型
 * **/
const initDoorsWindows=()=>{
  loader.load('./assets/office_20230504_doors_windows.glb', gltf => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0.5
      }
    })
    backWall = gltf.scene
    scene.add(backWall)
  })
}


/**
 * 初始化墙的模型
 * **/
const initModelWall = ()=>{
  loader.load('./assets/backWall_20230504_1541.glb', gltf => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0.3
      }
    })
    backWall = gltf.scene
    scene.add(backWall)
  })
}

/**
 * 设置灯光的基本属性
 * **/
const initLight = () => {
  const light = new Three.DirectionalLight(0xffffff, 1)
  light.position.set(0, 50, 8)
  light.castShadow = true
  scene.add(light)
  const light0 = new Three.DirectionalLight(0xffffff, 0.5)
  light0.position.set(0, 20, 10)
  light0.castShadow = true
  // scene.add(light0)
  const light1 = new Three.DirectionalLight(0xffffff, 1)
  light1.position.set(-10, 20, 0)
  light1.castShadow = true
  scene.add(light1)
  const light2 = new Three.DirectionalLight(0xffffff, 1)
  light2.position.set(0, 20, -10)
  light2.castShadow = true
  scene.add(light2)
  const light3 = new Three.DirectionalLight(0xffffff, 0.5)
  light3.position.set(10, 20, 0)
  light3.castShadow = true
  scene.add(light3)
  const light4 = new Three.DirectionalLight(0xffffff, 0.5)
  light4.position.set(0, 20, 10)
  light4.castShadow = true
  scene.add(light4)
}

/**
 * 创建地面模型
 * 模型加载到办公室模型环境中
 * 材质白色，双面
 * 组合材质以及模型，添加到场景中
 * **/
const initPlaneGround = () => {
  const planeGeometry = new Three.BoxGeometry(4.5, 0.018, 2.8)
  const materialBasic = new Three.MeshLambertMaterial({
    color: 0xEDEDED,
    side: Three.DoubleSide,
    transparent: true,
  });
  const planeEvent = new Three.Mesh(planeGeometry, materialBasic);
  planeEvent.position.set(0, -0.01, 0)
  planeEvent.castShadow = true //开启阴影
  planeEvent.receiveShadow = true
  planeEvent.visible = true
  scene.add(planeEvent)
}

window.addEventListener('resize', () => {
  let fullScreenWidth = window.innerWidth;
  let fullScreenHeight = window.innerHeight;
  camera.aspect = fullScreenWidth / fullScreenHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  cssRender.setSize(window.innerWidth, window.innerHeight)
})

onMounted(() => {
  initControls();
  initLight();
  initModelFile();
  initDoorsWindows();
  initModelWall();
  initCamera();
  render();
  initPlaneGround();
});

</script>

<style>

.bigScreen {
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 99;
  left: 0;
  top: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
}

.header {
  width: 19.2rem;
  height: 1.5rem;
  background-image: url(../assets/bg/logo-office_2023_0423.png);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  text-align: center;
  color: rgb(226, 226, 255);
  font-size: 0.4rem;
  margin-top: -0.3rem;
}

.main {
  flex: 1;
  width: 19.2rem;
  overflow: hidden;
  color: #48BEFC;
  position: absolute;
  top: 1rem;
  left: 90%;
  font-size: 0.12rem;
}

.left {
  width: 1rem;
  height: 1rem;
  text-align: center;
  margin-right: 0.5rem;
  border-radius: 0.1rem;
  cursor: pointer;
  pointer-events: auto;
  background: rgba(147, 126, 126, 0.4);
}

.right {
  margin-top: 0.5rem;
  width: 1rem;
  height: 1rem;
  text-align: center;
  border-radius: 0.1rem;
  cursor: pointer;
  pointer-events: auto;
  background: rgba(147, 126, 126, 0.4);
}

.icon {
  width: 0.5rem;
  height: 0.5rem;
  opacity: 1;
  margin-top: 0.12rem;
}

#jindu-text-con {
  width: 2.5rem;
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  top: 15%;
  text-align: center;
  background-color: rgba(255, 255, 255, .2);
  padding: 10px;
  border-radius: 5px;
  font-size: 0.12rem;
}

.jindu-con {
  width: 2.5rem;
  height: 0.1rem;
  border-radius: 50px;
  background-color: #E4E0D4;
  margin-top: 10px;
  overflow: hidden;
}

#jindu {
  height: inherit;
  background-color: #007bff;
  width: 0;
}
</style>
