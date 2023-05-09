<template>
  <router-view></router-view>
</template>

<script setup>

</script>

<style>
* {
  margin: 0;
  padding: 0;
}
* {
  padding: 0;
  margin: 0;
}

html {
  font-size: calc(100vw / 19.2);
}

body {
  font-size: 16px;
}

#css3dRender {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  pointer-events: none;
}


.elementTag {
  position: fixed;
  /*top: 0;*/
  /*left: 0;*/
}

/*.elementTag::before {*/
/*  content: "";*/
/*  display: block;*/
/*  position: absolute;*/
/*  width: 50px;*/
/*  height: 1px;*/
/*  background: rgb(127 177 255 / 75%);*/
/*  bottom: 0px;*/
/*  right: 0px;*/
/*  transform: rotate(-90deg);*/
/*  transform-origin: 0 0;*/
/*}*/

/*.elementTag::after {*/
/*  content: "";*/
/*  display: block;*/
/*  position: absolute;*/
/*  width: 16px;*/
/*  height: 16px;*/
/*  border-radius: 50%;*/
/*  background: rgb(127,177,255 / 75%);*/
/*  bottom: -59.9px;*/
/*  left: 0.35px;*/
/*}*/

.elementContent {
  background-color: rgba(20, 143, 211, 0.5);
  box-shadow: 0 0 12px rgba(0, 128, 255, 0.75);
  border: 1px solid rgba(127, 177, 255, 0.75);
  border-radius: 3px;
  padding: 0.5rem;
  color: #efefef;
}
.name{
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

/*.elementContent h3 {*/
/*  font-size: 20px;*/
/*  font-weight: bold;*/
/*  margin: 0;*/
/*}*/

/*.elementContent p {*/
/*  font-size: 16px;*/
/*  margin: 0;*/
/*}*/
</style>
