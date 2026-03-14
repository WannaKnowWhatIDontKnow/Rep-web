export function playAlertSound(): void {
    new Audio('/alert.mp3').play().catch(e => console.error('Audio error: ', e));
}