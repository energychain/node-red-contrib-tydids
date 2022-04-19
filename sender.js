module.exports = function(RED) {
    function SenderNode(config) {
       const TydidsP2P = require("tydids-p2p");
       const sleep = ms => new Promise(r => setTimeout(r, ms));
        let mappingRevisionMsg = {}

        RED.nodes.createNode(this,config);
        const node = this;
        const storage = node.context();
        let ssi = null;
        let mc = null;

        const setup = async function() {
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
          console.log("TyDIDs Version",ssi.version)
          storage.set("address",ssi.identity.address);
          storage.set("publicKey",ssi.identity.publicKey);
          if((typeof config.identity !== 'undefined') && (config.identity !== null) && (config.identity.length == 42)) {
            ssi.setIdentifier(config.identity);
          }
          let msg = {
            payload: {
              identity:ssi.identity.address,
              publicKey:ssi.identity.publicKey
            }
          };
          ssi.onReceivedACK(function(from,did) {
            if(typeof mappingRevisionMsg[did.payload._revision] !== 'undefined') {
                let msg = mappingRevisionMsg[did.payload._revision];
                msg.payload = {
                  send:msg.payload,
                  received:did.payload
                }
                node.send(msg);
            }
            node.status({fill:'green',shape:"dot",text:ssi.identity.address});
          })

        }


        node.on('input', async function(msg) {
            let res = {};
            node.status({fill:'yellow',shape:"dot",text:'initializing'});
            let i=0;
            while(ssi == null) {
              i++;
              await sleep(1000);
              if(i>7) {
                setup();
                i=0;
              }
            }
            node.status({fill:'red',shape:"dot",text:ssi.identity.address});
            if(typeof msg.payload !== 'object') msg.payload = {
              value:msg.payload
            };
            if(typeof msg.payload.payload !== 'undefined') msg.payload = msg.payload.payload;
            if(
              (typeof msg.payload._address !== 'undefined')&&(typeof msg.payload._revision !== 'undefined')
            ) {
              await ssi.replyPresentation(msg.payload._address,msg.payload._revision,msg.payload);
            } else {
              res = await ssi.updatePresentation(msg.payload);
            }
            mappingRevisionMsg[ssi.node.revision]=msg;
            node.status({fill:'green',shape:"dot",text:ssi.identity.address});
            node.send({payload:res});
        });

        setup();
    }
    RED.nodes.registerType("Tydids-Sender",SenderNode);
}
