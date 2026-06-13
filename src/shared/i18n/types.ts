import { Strings } from "@/constants/strings";

type DeepStrings<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]>;
};

export type AppStrings = DeepStrings<typeof Strings>;

export { Strings as enStrings };
