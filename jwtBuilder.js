module.exports = function(RED) {
    function jwtBuilderNode(config) {
       const TydidsP2P = require("tydids-p2p");

        RED.nodes.createNode(this,config);
        const node = this;
        const storage = node.context();
        let ssi = null;

        node.on('input', async function(msg) {
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

          }

            node.status({fill:'yellow',shape:"dot",text:'processing'});
            if(ssi == null) await setup();
            if(typeof msg.payload !== 'object') {
              msg.payload = { value: msg.payload };
            }
            try {
              const jwt = await ssi.buildJWT(msg.payload);
              node.status({fill:'green',shape:"dot",text:'success'});
              node.send({payload:jwt});
            } catch(e) {
              node.status({fill:'red',shape:"dot",text:'failed'});
            }


        });
    }
    RED.nodes.registerType("Tydids-JWTBuilder",jwtBuilderNode);
}
