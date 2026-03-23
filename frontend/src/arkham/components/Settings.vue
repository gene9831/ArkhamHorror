<script lang="ts" setup>
import { ref, computed, watch, inject, type Ref } from 'vue';
import { type Game } from '@/arkham/types/Game'
import { useDebug } from '@/arkham/debug'
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  game: Game
  playerId: string
  closeSettings: () => void
}>()

const debug = useDebug()
const investigator = computed(() => {
  return Object.values(props.game.investigators).find(i => i.playerId === props.playerId)
})

const cardSizeIncrement = inject('cardSizeIncrement') as Ref<number>
const skipTriggers = ref(investigator.value.settings.globalSettings.ignoreUnrelatedSkillTestTriggers)

watch(() => skipTriggers.value, (value) => {
  if (investigator.value) {
    debug.send(props.game.id,
      ({ tag: 'UpdateGlobalSetting'
       , contents: [investigator.value.id, {tag: "SetIgnoreUnrelatedSkillTestTriggers", contents: value}]
       }
      )
    )
  }
})

</script>
<template>
  <div class="settings">
    <div class="options box">
      <h2 class="title">{{$t('gameBar.viewSettingTitle', {investigator: investigator.name.title})}}</h2>
      <label>{{$t('gameBar.viewSettingSkipTriggers')}}</label>
      <input type="checkbox" v-model="skipTriggers" />
    </div>
    <div class="options box card-size-increment">
      <label >卡牌增大尺寸</label>
      <input type="range" min="0" max="20" v-model="cardSizeIncrement" />
      <span class="display-value">+{{ cardSizeIncrement }}px</span>
    </div>
    <div>
      <button @click="closeSettings">{{$t('close')}}</button>
    </div>
  </div>
</template>

<style scoped>
.box {
  margin: 10px;
}

label {
  margin-right: 10px;
}

button {
  width: 100%;
}

.card-size-increment {
  display: flex;
  align-items: center;
}

.card-size-increment input {
  flex: 1
}

.card-size-increment .display-value {
  margin-left: 10px;
}
</style>
