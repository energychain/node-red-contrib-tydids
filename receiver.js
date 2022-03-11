  module.exports = function(RED) {
    function ReceiverNode(config) {
      const TydidsP2P = require("tydids-p2p");
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      let ack = null;

       RED.nodes.createNode(this,config);
       const node = this;
       const storage = node.context();
       let ssi = null;
       let msg0 = null;
       let msg1 = null;
       const setup = async function() {
         node.status({fill:'yellow',shape:"dot",text:'initializing'});
         const peers = ['https://webrtc.tydids.com/gun'];
         let privateKey = await storage.get("privateKey");
         if((typeof config.privateKey !== 'undefined')&&(config.privatKey !== null) &&(config.privateKey.length == 66)) {
           privateKey = config.privateKey;
         }
         if((typeof privateKey == 'undefined')||(privateKey == null)) {
           const wallet = TydidsP2P.ethers.Wallet.createRandom();
           privateKey = wallet.privateKey;
           await storage.set("privateKey",privateKey);
         }
         ssi = await TydidsP2P.ssi(privateKey);
         storage.set("address",ssi.identity.address);
         storage.set("publicKey",ssi.identity.publicKey);
         let revision = await storage.get("revision");

         let did = await ssi.retrievePresentation(config.address);

         const sendMsg = async function(_msg) {
             let lastValue = JSON.stringify(await storage.get("lastValue"));
             if(lastValue !== JSON.stringify(_msg)) {
                await storage.set("lastValue",JSON.stringify(_msg));
                node.send(_msg);
             }
         }

         ssi.emitter.on('payload:ethr:6226:'+config.address,function(data) {
              node.status({fill:'green',shape:"dot",text:new Date().toUTCString()});
               let msg = {
                 payload: data
               };
               msg0 = msg;
               sendMsg([msg]);
         });
         ssi.emitter.on('presentation:ethr:6226:'+config.address,function(data) {
              node.status({fill:'green',shape:"dot",text:new Date().toUTCString()});
               let msg = {
                 payload: data
               };
               msg1 = msg;
               sendMsg([null,msg]);
         });
         ssi.onACK (function(_presentation) {
           if(ack !== null) {
              return ack;
           }
         });
         // add wait for revision?
       }

       node.on('input', async function(msg) {
         if(typeof msg.config !== 'undefined') {
           if(typeof msg.config.privateKey !== 'undefined') {
             config.privateKey = msg.config.privateKey;
           }
           if(typeof msg.config.presentation !== 'undefined') {
             config.address = msg.config.presentation;
           }
           if(typeof msg.config.address !== 'undefined') {
             config.address = msg.config.address;
           }
           setup();
         }
         if(msg0 !== null) msg0.topic = msg.topic;
         if(msg1 !== null) msg1.topic = msg.topic;
         node.send([null,null,msg0,msg1]);
         if(typeof msg.payload !== 'undefined') {
           ack = msg.payload;
           console.log('ack',ack);
         }
       });

       setup();
    }
    RED.nodes.registerType("Tydids-Receiver",ReceiverNode);
}
