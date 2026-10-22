
import {BaseModel} from "#mvc/models/BaseModel.js";
import {ModelMeta} from "#mvc/models/ModelMeta.js";
import {Instant} from "#mvc/util/uuid.js";

export class UserRole extends BaseModel {
        static META = ModelMeta.builderWithId('user_roles')
            .datasource('mysql')
            .column('id', String)
            .column('userContextId', String)
            .column('roleId', String)
            .column('createdBy', String)
            .column('createdAt', Instant)
            .column('expiresAt', Instant)
            .defaultSort('createdAt desc')
            .build();

        constructor({
            id = null,
            userContextId = null,
            roleId = null,
            createdBy = null,
            createdAt = null,
            expiresAt = null,
        } = {}) {
            super();
            this.id = id;
            this.userContextId = userContextId;
            this.roleId = roleId;
            this.createdBy = createdBy;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
        }
}

export default UserRole;