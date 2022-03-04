module.exports = function(RED) {
    function SenderNode(config) {
       const TydidsP2P = require("tydids-p2p");
       const sleep = ms => new Promise(r => setTimeout(r, ms));

        RED.nodes.createNode(this,config);
        const node = this;
        const storage = node.context();
        let ssi = null;
        let mc = null;

        const setup = async function() {
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
          ssi = await TydidsP2P.ssi(privateKey,true);
          storage.set("address",ssi.identity.address);
          storage.set("publicKey",ssi.identity.publicKey);

          let msg = {
            payload: {
              identity:ssi.identity.address,
              publicKey:ssi.identity.publicKey
            }
          };

          node.send(msg);
        }

        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:'initializing'});
            while(ssi == null) {
              await sleep(100);
            }
            node.status({fill:'red',shape:"dot",text:ssi.identity.address});
            if(typeof msg.payload !== 'object') msg.payload = {
              value:msg.payload
            };
            await ssi.updatePresentation(msg.payload);
            node.status({fill:'green',shape:"dot",text:ssi.identity.address});
        });

        setup();
    }
    RED.nodes.registerType("Tydids-Sender",SenderNode);
}
