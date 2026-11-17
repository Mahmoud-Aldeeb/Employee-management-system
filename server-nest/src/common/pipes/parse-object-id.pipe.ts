import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import mongoose from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (!mongoose.isObjectIdOrHexString(value)) {
      throw new BadRequestException('Invalid id');
    }
    return value;
  }
}
