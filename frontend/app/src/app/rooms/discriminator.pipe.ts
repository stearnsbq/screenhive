import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'discriminator'
})
export class DiscriminatorPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {


    const [user, discriminator] = value.split("#");


    return `${user}#${(discriminator || "").padEnd(4, "0")}`

  }

}
