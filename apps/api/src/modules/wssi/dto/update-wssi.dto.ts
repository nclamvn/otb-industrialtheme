import { PartialType } from '@nestjs/mapped-types';
import { CreateWSSIDto } from './create-wssi.dto';

export class UpdateWSSIDto extends PartialType(CreateWSSIDto) {}
