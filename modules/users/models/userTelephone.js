
import {BaseModel} from "#mvc/models/BaseModel.js";
import {ModelMeta} from "#mvc/models/ModelMeta.js";
import {Instant} from "#mvc/util/uuid.js";

export class UserTelephone extends BaseModel {
        static META = ModelMeta.builderWithId('user_telephone')
            .datasource('mysql')
            .column('id', String)
            .column('userId', String)
            .column('countryCode', String, 3)
            .column('numberRaw', String, 15)
            .column('numberE164', String, 15)
            .column('type', String, 20)
            .column('verified', Boolean)
            .column('smsOptIn', Boolean)
            .column('preferred', Boolean)
            .column('extension', String, 10)
            .column('createdAt', Instant)
            .column('updatedAt', Instant)
            .column('deletedAt', Instant)
            .column('createdBy', String)
            .column('updatedBy', String)
            .column('deletedBy', String)
            .defaultSort('createdAt desc')
            .build();

        constructor({
            id = null,
            userId = null,
            countryCode = null,
            numberRaw = null,
            numberE164 = null,
            type = null,
            verified = null,
            smsOptIn = null,
            preferred = null,
            extension = null,
            createdAt = null,
            updatedAt = null,
            deletedAt = null,
            createdBy = null,
            updatedBy = null,
            deletedBy = null,
        } = {}) {
            super();
            this.id = id;
            this.userId = userId;
            this.countryCode = countryCode;
            this.numberRaw = numberRaw;
            this.numberE164 = numberE164;
            this.type = type;
            this.verified = verified;
            this.smsOptIn = smsOptIn;
            this.preferred = preferred;
            this.extension = extension;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
            this.deletedAt = deletedAt;
            this.createdBy = createdBy;
            this.updatedBy = updatedBy;
            this.deletedBy = deletedBy;
        }
}

export default UserTelephone;