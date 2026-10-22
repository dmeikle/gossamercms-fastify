
import { BaseModel } from '#mvc/models/BaseModel.js';
import { ModelMeta } from '#mvc/models/ModelMeta.js';
import { Instant } from '#mvc/util/uuid.js';


export class User extends BaseModel {
    static META = ModelMeta.builderWithId('users')
        .datasource('mysql')
        .column('firstname', String, 50)
        .column('lastname', String, 50)
        .column('status', String, 20)
        .column('ipAddress', String, 15)
        .column('createdAt', Instant)
        .column('deletedAt', Instant)
        .column('updatedAt', Instant)
        .column('createdBy', String, 36)
        .column('deletedBy', String, 36)
        .column('updatedBy', String, 36)
        .defaultSort('lastname')
        .build();

    constructor({
                    id = null,
                    firstname = null,
                    lastname = null,
                    status = null,
                    ipAddress = null,
                    createdAt = null,
                } = {}) {
        super();

        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.status = status;
        this.ipAddress = ipAddress;
        this.createdAt = createdOn;
    }
}

export default User;
