import assert from 'node:assert/strict';
import { getButtonNodes, applyButtons, wrapInteractive, validateInteractiveButtons } from '../lib/Utils/buttons.js';
const PM='123@s.whatsapp.net', GR='123-456@g.us';
const nf={interactiveMessage:{nativeFlowMessage:{buttons:[]}}};
const names=n=>n.map(x=>x.tag);
// private / group
assert.deepEqual(names(getButtonNodes(PM,nf)),['biz','bot']);
assert.deepEqual(names(getButtonNodes(GR,nf)),['biz']);
assert.equal(getButtonNodes(PM,nf)[0].content[0].content[0].attrs.name,'mixed');
assert.equal(getButtonNodes(PM,nf)[1].attrs.biz_bot,'1');
// buttonsMessage, lid
assert.deepEqual(names(getButtonNodes('1@lid',{buttonsMessage:{}})),['biz','bot']);
// list
const l=getButtonNodes(GR,{listMessage:{}});
assert.equal(l[0].content[0].tag,'list'); assert.equal(l[0].content[0].attrs.type,'product_list'); assert.equal(l[0].content[0].attrs.v,'2');
// wrappers
assert.deepEqual(names(getButtonNodes(PM,{ephemeralMessage:{message:nf}})),['biz','bot']);
assert.deepEqual(names(getButtonNodes(PM,{viewOnceMessage:{message:nf}})),['biz','bot']);
assert.deepEqual(names(getButtonNodes(PM,{ephemeralMessage:{message:{viewOnceMessage:{message:nf}}}})),['biz','bot']);
assert.deepEqual(names(getButtonNodes(PM,{documentWithCaptionMessage:{message:{buttonsMessage:{}}}})),['biz','bot']);
// plain messages and other jids = empty
assert.deepEqual(getButtonNodes(PM,{conversation:'hi'}),[]);
assert.deepEqual(getButtonNodes(PM,{extendedTextMessage:{text:'x'}}),[]);
assert.deepEqual(getButtonNodes(PM,{imageMessage:{}}),[]);
assert.deepEqual(getButtonNodes('120363@newsletter',nf),[]);
assert.deepEqual(getButtonNodes('status@broadcast',nf),[]);
assert.deepEqual(getButtonNodes(PM,undefined),[]);
// validation
const ok=[{name:'quick_reply',buttonParamsJson:{display_text:'A',id:'a'}},{name:'cta_url',buttonParamsJson:JSON.stringify({display_text:'U',url:'https://x.y'})}];
assert.equal(validateInteractiveButtons(ok)[0].buttonParamsJson,'{"display_text":"A","id":"a"}');
for (const bad of [[],'x',[{name:'nope',buttonParamsJson:'{}'}],[{name:'quick_reply',buttonParamsJson:'{bad'}],[{name:'cta_url',buttonParamsJson:{display_text:'U'}}],[{name:'quick_reply'}]])
  assert.throws(()=>validateInteractiveButtons(bad),/interactiveButtons/);
// build: text + interactiveButtons -> wrapped -> nodes
let m=applyButtons({text:'hi',footer:'f',interactiveButtons:ok},{extendedTextMessage:{text:'hi'}});
assert.equal(m.interactiveMessage.body.text,'hi'); assert.equal(m.interactiveMessage.footer.text,'f'); assert.equal(m.interactiveMessage.nativeFlowMessage.buttons.length,2);
m=wrapInteractive(m); assert.ok(m.viewOnceMessage.message.interactiveMessage); assert.equal(m.viewOnceMessage.message.messageContextInfo.deviceListMetadataVersion,2);
assert.deepEqual(names(getButtonNodes(PM,m)),['biz','bot']);
// legacy buttons text/image
m=applyButtons({text:'t',footer:'f',buttons:[{buttonId:'1',buttonText:{displayText:'A'},type:1}]},{extendedTextMessage:{text:'t'}});
assert.equal(m.buttonsMessage.contentText,'t'); assert.equal(m.buttonsMessage.headerType,1);
m=applyButtons({image:{url:'x'},caption:'c',buttons:[{buttonId:'1',buttonText:{displayText:'A'},type:1}]},{imageMessage:{caption:'c',url:'x'}});
assert.equal(m.buttonsMessage.headerType,4); assert.equal(m.buttonsMessage.contentText,'c'); assert.equal(m.buttonsMessage.imageMessage.caption,undefined);
// list
m=applyButtons({text:'d',title:'T',buttonText:'Open',sections:[{title:'s',rows:[]}]},{extendedTextMessage:{text:'d'}});
assert.equal(m.listMessage.buttonText,'Open'); assert.equal(m.listMessage.listType,1);
// template
m=applyButtons({text:'d',templateButtons:[{index:1,quickReplyButton:{displayText:'x',id:'1'}}]},{extendedTextMessage:{text:'d'}});
assert.equal(m.templateMessage.hydratedTemplate.hydratedContentText,'d');
// no button input => same object untouched
const plain={extendedTextMessage:{text:'x'}}; assert.equal(applyButtons({text:'x'},plain),plain); assert.equal(wrapInteractive(plain),plain);
// wrapInteractive no double wrap
assert.equal(wrapInteractive({viewOnceMessage:{}}).viewOnceMessage.message,undefined);
// jid filtering
import { getButtonChatType } from '../lib/Utils/buttons.js';
assert.equal(getButtonChatType('123:7@s.whatsapp.net'),'user');
assert.equal(getButtonChatType('999:2@lid'),'user');
assert.equal(getButtonChatType(' 123@s.whatsapp.net '),'user');
assert.equal(getButtonChatType('123-4@g.us'),'group');
for (const j of ['@s.whatsapp.net','','x',null,undefined,'1@newsletter','status@broadcast','1@broadcast','1@bot','1@hosted','1@hosted.lid','0@c.us'])
  assert.equal(getButtonChatType(j),undefined,String(j));
assert.deepEqual(getButtonNodes('123:7@s.whatsapp.net',nf).map(x=>x.tag),['biz','bot']);
console.log('buttons unit tests OK');
