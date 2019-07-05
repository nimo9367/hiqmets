<template>
     <div>
        <div class="input"> 
            <input type="file" multiple accept="image/jpeg,image/png" @change="detectFiles($event.target.files)" >
        </div>
        <div v-if="progressUpload > 0 && progressUpload < 100"> 
            <progress class="progress is-small" v-bind:value="progressUpload"></progress>
        </div>
    </div>
</template>

<script>
import { firebase } from '@firebase/app';
import '@firebase/storage';
export default {
  data () {
    return {
      progressUpload: 0,
      file: File,
      uploadTask: '',
    }
  },
  props: ['imgName'],
  methods: {
    detectFiles (fileList) {
        let _URL = window.URL || window.webkitURL;
        let self = this;
        Array.from(Array(fileList.length).keys()).map( x => {
            if(fileList[x].size/1024/1024 > 1.0) {
                self.$toast.open({
                    message: 'Bilden måste vara under 1MB',
                    type: 'is-danger'
                });
                return;
            }
                
            let img = new Image();
            img.onload = function () {
            if(this.width == this.height)
                    self.upload(fileList[x]);
                else {
                    self.$toast.open({
                        message: 'Bilden måste ha ratio 1:1 (kvadratisk)',
                        type: 'is-danger'
                    });
                }
            };
            img.src = _URL.createObjectURL(fileList[x]);
        })
    },
    upload (file) {
      this.uploadTask = firebase.storage().ref(this.imgName).put(file);
    }
  },
  watch: {
    uploadTask: function() {
      this.uploadTask.on('state_changed', sp => {
        this.progressUpload = Math.floor(sp.bytesTransferred / sp.totalBytes * 100)
      }, 
      null, 
      () => {
        this.uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
          this.$emit('url', downloadURL)
        })
      })
    }
  },
  name: "FileUploader"
}
</script>

<style>
.progress-bar {
  margin: 10px 0;
}
</style>