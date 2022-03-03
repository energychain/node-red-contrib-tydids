module.exports = function(RED) {
    function ReceiverNode(config) {
      const TydidsP2P = require("tydids-p2p");
      const sleep = ms => new Promise(r => setTimeout(r, ms));

       RED.nodes.createNode(this,config);
       const node = this;
       const storage = node.context();
       let ssi = null;
       let mc = null;

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
         let lastValue = JSON.stringify(await storage.get("lastValue"));
         if(lastValue !== JSON.stringify(did)) {
             let msg = {
               payload: did
             };
             node.send(msg);
             ssi.emitter.on('did:ethr:6226:'+config.address,function(data) {
               let msg = {
                 payload: data
               };
               node.send([msg]);
               if(typeof msg.payload['_revision'] !== 'undefined') {
                 storage.set("revision",msg.payload['_revision']);
                 ssi.retrievePresentation(config.address,msg.payload['_revision'])
               }
             });
             ssi.emitter.on('raw:did:ethr:6226:'+config.address,function(data) {
               let msg = {
                 payload: data
               };
               node.send([null,msg]);
             });
             await storage.set("lastValue",JSON.stringify(did));
         }
         node.status({fill:'green',shape:"dot",text:''});
       }

       node.on('input', async function(msg) {
         if((config == null)||(ssi == null)) { return } else {
           let did = await ssi.retrievePresentation(config.address);
           let sendmsg = {
             payload: did
           };
           node.send(sendmsg);
         }
       });

       setup();
    }
    RED.nodes.registerType("Tydids-Receiver",ReceiverNode);
}
