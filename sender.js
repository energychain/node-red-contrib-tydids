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
          if((typeof privateKey == 'undefined')||(privateKey == null)) {
            const wallet = TydidsP2P.ethers.Wallet.createRandom();
            privateKey = wallet.privateKey;
            await storage.set("privateKey",privateKey);
          }
          ssi = await TydidsP2P.ssi(privateKey);
          storage.set("address",ssi.identity.address);
          storage.set("publicKey",ssi.identity.publicKey);
          mc = await storage.get("mc");
          if((typeof mc == 'undefined') || (mc == null)) {
            let vp = await ssi.createManagedPresentation();
            mc = vp.address;
            storage.set("mc",mc);
          }
          let msg = {
            payload: {
              presentation:mc,
              identity:ssi.identity.address,
              publicKey:ssi.identity.publicKey
            }
          };
          
          node.send(msg);
        }

        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:'initializing'});
            while((ssi == null)||(mc == null)) {
              console.log("Tydids-Sender:Waiting for auto-setup to finish.");
              await sleep(1000);
            }
            node.status({fill:'red',shape:"dot",text:mc});
            if(typeof msg.payload !== 'object') msg.payload = {
              value:msg.payload
            };
            await ssi.updateVP(mc,msg.payload,{},{});
            node.status({fill:'green',shape:"dot",text:mc});
        });

        setup();
    }
    RED.nodes.registerType("Tydids-Sender",SenderNode);
}
