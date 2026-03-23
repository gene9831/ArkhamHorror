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

const cardMinWidth = inject('cardMinWidth') as Ref<number>
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
    <div class="options box card-min-width">
      <label >卡牌最小宽度</label>
      <input type="range" min="60" max="120" v-model="cardMinWidth" />
      <span class="display-value">{{ cardMinWidth }}</span>
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

.card-min-width {
  display: flex;
  align-items: center;
}

.card-min-width input {
  flex: 1
}

.card-min-width .display-value {
  margin-left: 10px;
}
</style>
