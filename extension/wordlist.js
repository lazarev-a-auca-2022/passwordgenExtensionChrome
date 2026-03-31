'use strict';

// 300-word curated list. log2(300) ≈ 8.2 bits/word.
// 5 words ≈ 41 bits, 6 words ≈ 49 bits, 8 words ≈ 66 bits.
const WORDLIST = [
  // Animals (40)
  'wolf','bear','eagle','lion','shark','whale','horse','snake','hawk','deer',
  'frog','crow','dove','fox','owl','seal','duck','fish','bee','ant',
  'rabbit','parrot','zebra','monkey','tiger','panda','koala','moose','bison','crane',
  'lynx','raven','pike','eel','yak','ibis','viper','stag','rook','moth',
  // Nature (50)
  'storm','cloud','river','ocean','forest','desert','mountain','valley','island','fire',
  'snow','rain','wind','earth','stone','sand','grass','leaf','tree','flower',
  'lake','field','hill','cave','sky','sun','moon','star','wave','tide',
  'frost','thunder','mist','fog','dawn','dusk','spring','summer','autumn','winter',
  'coast','cliff','beach','marsh','ridge','slope','creek','pond','dune','reef',
  // Adjectives (40)
  'blue','red','green','black','white','golden','silver','bright','dark','swift',
  'brave','bold','calm','cool','wild','sharp','deep','wide','tall','small',
  'round','rough','smooth','soft','hard','fresh','clean','clear','pure','strong',
  'old','new','fast','slow','loud','quiet','young','long','short','heavy',
  // Verbs (50)
  'run','jump','fly','swim','climb','build','break','catch','chase','dive',
  'draw','dream','drive','fall','fight','flow','force','forge','grab','grow',
  'guard','guide','hunt','keep','leap','lift','move','open','push','reach',
  'rise','roll','rush','sail','save','seek','shake','shape','shine','shoot',
  'skip','slide','spin','stand','stay','swing','throw','trust','turn','walk',
  // Objects (50)
  'door','wall','key','lock','path','road','bridge','tower','castle','sword',
  'shield','book','map','sign','mask','ring','rope','ship','bolt','chain',
  'blade','crown','gate','helm','vault','bell','bowl','brush','cage','cart',
  'coin','cord','cup','dart','desk','drum','fence','flag','flask','gem',
  'glove','hammer','jar','lamp','lens','nail','net','pan','plate','pot',
  // Technology (30)
  'byte','code','core','data','disk','file','hash','link','loop','mesh',
  'node','pipe','port','queue','root','scan','seed','sync','tag','thread',
  'wire','block','cache','clock','fork','frame','grid','heap','host','shell',
  // Food / Plants (30)
  'bread','wine','salt','sugar','honey','milk','rice','bean','corn','pie',
  'cake','jam','tea','oil','herb','lime','mint','sage','basil','cream',
  'grape','lemon','maple','melon','olive','peach','plum','wheat','apple','pine',
  // Misc (10)
  'axe','bow','spear','staff','scroll','lantern','glyph','rune','spark','flare',
];
