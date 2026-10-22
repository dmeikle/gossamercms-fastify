import {BaseModel} from "#mvc/models/BaseModel.js";
import {ModelMeta} from "#mvc/models/ModelMeta.js";
import {Instant} from "#mvc/util/uuid.js";

export class UserContext extends BaseModel {
    static META = ModelMeta.builderWithId('user_contexts')
        .datasource('mysql')
        .column('userId', String, 50)
        .column('contextType', String, 50)
        .column('metadata', Object)
        .column('ipAddress', String, 15)
        .column('isDefault', Boolean)
        .column('roleId', String, 36)
        .column('createdAt', Instant)
        .column('deletedAt', Instant)
        .column('updatedAt', Instant)
        .column('createdBy', String, 36)
        .column('deletedBy', String, 36)
        .column('updatedBy', String, 36)
        .column()
        .defaultSort('userId')
        .build();

    constructor({
                    id = null,
                    userId = null,
                    contextType = null,
                    metadata = null,
                    ipAddress = null,
                    isDefault = null,
                    roleId = null,
                    createdAt = null,
                    updatedAt = null,
                    createdBy = null,
                    updatedBy = null,
                } = {}) {
        super();

        this.id = id;
        this.userId = userId;
        this.contextType = contextType;
        this.metadata = metadata;
        this.ipAddress = ipAddress;
        this.isDefault = isDefault;
        this.roleId = roleId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
        this.updatedBy = updatedBy;
    }
}

export default UserContext;