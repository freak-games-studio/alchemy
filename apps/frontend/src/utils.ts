import { watchEffect } from 'vue'

export const untrack = <T extends (...args: any[]) => any>(
  fn: T
): ReturnType<T> => {
  let result
  const stopHandle = watchEffect(() => (result = fn()))
  stopHandle()
  return result as ReturnType<T>
}
