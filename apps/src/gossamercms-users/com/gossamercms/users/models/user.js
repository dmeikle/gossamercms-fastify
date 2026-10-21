
import { BaseModel } from '../../../../../../../libs/com.gossamercms-fastify/mvc/models/BaseModel.js';
import { ModelMeta } from '../../../../../../../libs/com.gossamercms-fastify/mvc/models/ModelMeta.js';
import { Instant } from '../../../../../../../libs/com.gossamercms-fastify/mvc/util/uuid.js';


export class User extends BaseModel {
    static META = ModelMeta.builderWithId('users')
        .column('firstname', String, 50)
        .column('lastname', String, 50)
        .column('status', String, 20)
        .column('ipAddress', String, 15)
        .column('createdOn', Instant)
        .defaultSort('lastname')
        .build();

    constructor({
                    id = null,
                    firstname = null,
                    lastname = null,
                    status = null,
                    ipAddress = null,
                    createdOn = null,
                } = {}) {
        super();

        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.status = status;
        this.ipAddress = ipAddress;
        this.createdOn = createdOn;
    }
}

export default User;
