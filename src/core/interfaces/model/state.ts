export interface IState<T> {
    hasError?: boolean;
    data?: T;
    message?: string;
}