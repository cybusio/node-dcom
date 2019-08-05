//@ts-check

const ErrorCodes = require('../common/errorcodes');
const Pointer = require('./pointer');
const ComString = require('./string');
const Flags = require('./flags');
const Struct = require('./struct');
const MarshalUnMarshalHelper = require('./marshalunmarshalhelper');
const NetworkDataRepresentation = require('../ndr/networkdatarepresentation');


class Union {

    /**
     * Creates an object with discriminant type specified. Used only during deserializing
	 *  the union. Can only be of the type <code>Integer</code>,<code>Short</code>,<code>Boolean</code>
	 *  or <code>Character</code>. <br>
     * @param {string} [discriminantClass]
     */
    constructor(discriminantClass){
        this.dsVsMember = new Map();
        if (!(discriminantClass === 'Integer' || discriminantClass === 'Short' || discriminantClass === 'Boolean' || discriminantClass === 'Character')) {
            throw new Error("UNION_INCORRECT_DISC" + ErrorCodes.UNION_INCORRECT_DISC)
        }
        
        this.discriminantClass = discriminantClass;

    }

	/** Adds a member to this Union. The <code>member</code> is distinguished using the <code>discriminant</code>. <br>
	 *
	 * @param {*} discriminant
	 * @param {*} member
	 * @throws JIException
	 * @throws IllegalArgumentException if any parameter is <code>null</code>
	 */
    addMember(discriminant, member) {

        if (!discriminant || !member) {
            throw new Error("UNION_NULL_DISCRMINANT" + ErrorCodes.UNION_NULL_DISCRMINANT);
        }

        if (!discriminant.getClass().equals(discriminantClass)) {
            throw new Error("UNION_DISCRMINANT_MISMATCH" + ErrorCodes.UNION_DISCRMINANT_MISMATCH);
        }

        if ((member instanceof Pointer && !member.isReference()) || member instanceof ComString) {
            member.setDeffered(true);
        }

        this.dsVsMember.set(discriminant, member);
    }

    /** Adds a member to this Union. The <code>member</code> is distinguished using the <code>discriminant</code>. <br>
     *
     * @param discriminant
     * @param member
     * @throws JIException
     * @throws IllegalArgumentException if <code>discriminant</code> is <code>null</code>
     */
    //used both for reading and writing
    addMember(discriminant, member) {
        if (discriminant == null) {
            throw new IllegalArgumentException(JISystem.getLocalizedMessage(ErrorCodes.UNION_NULL_DISCRMINANT));
        }

        if (!discriminant.getClass().equals(discriminantClass)) {
            throw new JIException(ErrorCodes.UNION_DISCRMINANT_MISMATCH);
        }

        if (member == null) {
            member = JIStruct.MEMBER_IS_EMPTY;
        }

        this.dsVsMember.set(discriminant, member);
        //do not need a seperate list of pointers like the struct , since based on the discriminant only 1 pointer
        //(if present) can be deserialized\serialized.
    }

    /**Removes the entry , identified by it's <code>discriminant</code> from the parameter list of the union. <br>
     *
     * @param {*} discriminant
     */
    removeMember(discriminant) {
        this.dsVsMember.delete(discriminant);
    }

        /** Returns the discriminant Vs there members Map. <br>
         *
         * @return
         */
    getMembers() {
        return this.dsVsMember;
    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @param {Pointer[]} listOfDefferedPointers  
     * @param {number} flags 
     */
    encode(ndr, listOfDefferedPointers, flags) {
        if (this.dsVsMember.size != 1) {
            throw new Error("UNION_DISCRMINANT_SERIALIZATION_ERROR" + ErrorCodes.UNION_DISCRMINANT_SERIALIZATION_ERROR);
        }

        //first write the discriminant and then the member
        let keys = this.dsVsMember.keys();
        MarshalUnMarshalHelper.serialize(ndr, this.discriminantClass, keys.next().value, listOfDefferedPointers, flags);

        keys = this.dsVsMember.values();
        let value = keys.next().value;

        //will not write empty union members
        if (!value.equals(Struct.MEMBER_IS_EMPTY)) {
            MarshalUnMarshalHelper.serialize(ndr, MarshalUnMarshalHelper.inferClass(value), value, listOfDefferedPointers, flags);
        }

    }

    /**
     * 
     * @param {NetworkDataRepresentation} ndr
     * @param {Pointer[]} listOfDefferedPointers 
     * @param {number} flags 
     * @param {Map} additionalData 
     */
    decode(ndr, listOfDefferedPointers, flags, additionalData)
    {
        //first read discriminant, and then call the appropriate deserializer of the member
        if (this.dsVsMember.size == 0) {
            throw new Error("UNION_DISCRMINANT_DESERIALIZATION_ERROR" + ErrorCodes.UNION_DISCRMINANT_DESERIALIZATION_ERROR);
        }

        //shallowClone();
        //first write the discriminant and then the member
        let retVal = new Union();
        retVal.discriminantClass = this.discriminantClass;

        let key = MarshalUnMarshalHelper.deSerialize(ndr, this.discriminantClass, listOfDefferedPointers, flags, additionalData);

        //next thing to be deserialized is the member
        let value = this.dsVsMember.get(key);

        //should allow null since this could be a "default"
        if (value == null) {
            value = Struct.MEMBER_IS_EMPTY;
        }

        //will not write empty union members
        if (value != (Struct.MEMBER_IS_EMPTY)) {
            retVal.dsVsMember.set(key, MarshalUnMarshalHelper.deSerialize(ndr, value, listOfDefferedPointers, flags, additionalData));
        } else {
            retVal.dsVsMember.set(key, value);
        }

        return retVal;
    }

    getLength()
    {
        let length = 0;
        for (const o of this.dsVsMember.keys()) {
            let temp = MarshalUnMarshalHelper.getLengthInBytes(MarshalUnMarshalHelper.inferClass(o), o, Flags.FLAG_NULL);
            length = Math.max(length, temp); //length of the largest member
        }

        return length + MarshalUnMarshalHelper.getLengthInBytes(this.discriminantClass, null, Flags.FLAG_NULL);
    }

    getAlignment()
    {
        let alignment = 0;

        if (this.discriminantClass == 'Integer') {
            //align with 4 bytes
            alignment = 4;
        } else if (this.discriminantClass == 'Short') {
            //align with 2
            alignment = 2;
        }

        return alignment;
    }

}

module.exports = Union;