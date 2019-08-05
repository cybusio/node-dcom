var ConnectionOrientedPdu = require("../connectionorientedpdu.js");
var PresentationContext = require("../core/presentationcontext.js");

class AlterContextPdu  extends ConnectionOrientedPdu{
  constructor(){
    super();
    this.ALTER_CONTEXT_TYPE = 0x0e;

    this.contextList;

    this.maxTransmitFramgent = -1;
    this.maxReceiveFragment = -1;

    this.associationGroupId = 0;
  }

  getType(){
    return this.ALTER_CONTEXT_TYPE;
  }

  getMaxTransmitFramgent(){
    return this.maxTransmitFramgent;
  }

  setMaxTransmitFramgent(maxTransmitFramgent){
    this.maxTransmitFramgent = maxTransmitFramgent;
  }

  getMaxReceiveFragment(){
    return this.maxReceiveFragment;
  }

  setMaxReceiveFragment(maxReceiveFragment){
    this.maxReceiveFragment = maxReceiveFragment;
  }

  getAssociationGroupId(){
    return this.associationGroupId;
  }

  setAssociationGroupId(associationGroupId){
    this.associationGroupId = associationGroupId;
  }

  getContextList(){
    return this.contextList;
  }

  setContextList(contextList){
    this.contextList = contextList;
  }

  readBody(ndr){
    this.maxTransmitFramgent = ndr.readUnsingedShort();
    this.maxReceiveFragment = ndr.readUnsingedShort();
    this.associationGroupId = Number.parseInt(ndr.readUnsingedShort());
    var count = ndr.readUnsignedSmall();
    var contextList = [count];
    for (var i = 0; i < count; i++){
      contextList[i] = new PresentationContext();
      contextList[i].read(ndr);
    }
    contextList(contextList);
  }

  writeBody(ndr){
    var maxTransmitFramgent = this.getMaxTransmitFramgent();
    var maxReceiveFragment = this.getMaxReceiveFragment();
    ndr.writeUnsignedShort((maxTransmitFramgent == -1) ?
        ndr.getBuffer().getCapacity() : this.getMaxTransmitFramgent());
    ndr.writeUnsignedShort((maxReceiveFragment == -1) ?
        ndr.getBuffer().getCapacity() : this.getMaxReceiveFragment());
    ndr.writeUnsignedLong(this.getAssociationGroupId());
    var contextList = this.getContextList();
    var count = contextList.length;
    ndr.writeUnsignedSmall(count);
    for (var i = 0; i < count; i++){
      contextList[i].write(ndr);
    }
  }
}

module.exports = AlterContextPdu;
