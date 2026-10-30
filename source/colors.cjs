'use strict';
// Shared by move labels and damage fills; the outline conveys the attacking side.
const TYPE_COLORS={Normal:'#82909a',Fire:'#d55840',Water:'#397bc7',Electric:'#bc980d',Grass:'#39965b',Ice:'#408f9b',Fighting:'#ae483a',Poison:'#924ca4',Ground:'#b17d35',Flying:'#667fc8',Psychic:'#a64780',Bug:'#78933a',Rock:'#887b58',Ghost:'#66538e',Dragon:'#5855a9',Dark:'#55505d',Steel:'#547f89',Fairy:'#bb6ba7'};
const typeColor=type=>TYPE_COLORS[type]||'#82909a';
module.exports={TYPE_COLORS,typeColor};
