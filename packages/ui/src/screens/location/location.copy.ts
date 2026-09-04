import type { LocationLocale, LocationState } from '@hielya/location';

interface LocationCopy {
  title: string;
  intro: string;
  useCurrentLocation: string;
  enterManually: string;
  searchLabel: string;
  searchPlaceholder: string;
  search: string;
  privacy: string;
  confirmTitle: string;
  confirm: string;
  edit: string;
  continue: string;
  retry: string;
  cancel: string;
  suggestionLabel: string;
  kind: Record<string, string>;
  stateTitle: Record<LocationState, string>;
  stateMessage: Record<LocationState, string>;
}

const es: LocationCopy = {
  title: '¿Dónde quieres recibir tu pedido?',
  intro: 'Usa tu ubicación o introduce una dirección para comprobar la cobertura.',
  useCurrentLocation: 'Usar mi ubicación',
  enterManually: 'Introducir dirección',
  searchLabel: 'Dirección de entrega',
  searchPlaceholder: 'Calle, hotel o residencial',
  search: 'Buscar dirección',
  privacy: 'La ubicación se solicita solo cuando pulsas el botón. No hacemos seguimiento en segundo plano.',
  confirmTitle: 'Confirma la dirección',
  confirm: 'Confirmar dirección',
  edit: 'Editar dirección',
  continue: 'Continuar',
  retry: 'Intentar de nuevo',
  cancel: 'Cancelar',
  suggestionLabel: 'Sugerencias de dirección',
  kind: { residential: 'Vivienda', hotel: 'Hotel', condominium: 'Residencial', business: 'Empresa', public_space: 'Espacio público', unknown: 'Dirección' },
  stateTitle: {
    idle: 'Localización', requesting_permission: 'Permiso de ubicación', locating: 'Buscando tu ubicación', reverse_geocoding: 'Identificando la dirección', manual_entry: 'Introduce la dirección', validating_manual_address: 'Comprobando la dirección', resolved: 'Dirección encontrada', checking_service_area: 'Comprobando cobertura', permission_denied: 'Permiso no concedido', location_unavailable: 'Ubicación no disponible', timeout: 'La solicitud tardó demasiado', offline: 'Sin conexión', network_error: 'No pudimos validar la dirección', invalid_address: 'Dirección no válida', out_of_area: 'Fuera del área de entrega', retrying: 'Intentándolo de nuevo', success: 'Dirección confirmada',
  },
  stateMessage: {
    idle: 'Elige cómo quieres indicar el destino.', requesting_permission: 'Tu navegador puede pedirte permiso. También puedes continuar manualmente.', locating: 'Estamos obteniendo una posición aproximada. Después podrás confirmar la dirección.', reverse_geocoding: 'Estamos convirtiendo la posición en una dirección que puedas revisar.', manual_entry: 'Busca una calle, un hotel o un residencial.', validating_manual_address: 'Estamos consultando las sugerencias disponibles.', resolved: 'Revisa la dirección antes de comprobar la cobertura.', checking_service_area: 'La cobertura y la tarifa las valida el servicio de entrega.', permission_denied: 'Puedes introducir la dirección manualmente. No volveremos a solicitar permiso sin tu acción.', location_unavailable: 'El dispositivo no devolvió una posición válida.', timeout: 'Conservamos tus datos para que puedas volver a intentarlo.', offline: 'Puedes preparar la dirección, pero la cobertura requiere conexión.', network_error: 'El servicio temporal no está disponible.', invalid_address: 'Prueba con una dirección más completa o selecciona una sugerencia.', out_of_area: 'Prueba con otra dirección dentro del radio operativo.', retrying: 'Repetimos solo la última operación segura.', success: 'La pantalla emitirá LOCATION_CONFIRMED. El application layer decidirá el destino.',
  },
};

const en: LocationCopy = {
  ...es,
  title: 'Where should we deliver your order?',
  intro: 'Use your location or enter an address to check coverage.',
  useCurrentLocation: 'Use my location', enterManually: 'Enter address', searchLabel: 'Delivery address', searchPlaceholder: 'Street, hotel or residence', search: 'Search address', privacy: 'Location is requested only after you press the button. Background tracking is not used.', confirmTitle: 'Confirm the address', confirm: 'Confirm address', edit: 'Edit address', continue: 'Continue', retry: 'Try again', cancel: 'Cancel', suggestionLabel: 'Address suggestions',
};

const pt: LocationCopy = {
  ...es,
  title: 'Onde você quer receber o pedido?',
  intro: 'Use sua localização ou informe um endereço para verificar a cobertura.',
  useCurrentLocation: 'Usar minha localização', enterManually: 'Informar endereço', searchLabel: 'Endereço de entrega', searchPlaceholder: 'Rua, hotel ou condomínio', search: 'Buscar endereço', privacy: 'A localização só é solicitada depois que você toca no botão. Não fazemos rastreamento em segundo plano.', confirmTitle: 'Confirme o endereço', confirm: 'Confirmar endereço', edit: 'Editar endereço', continue: 'Continuar', retry: 'Tentar novamente', cancel: 'Cancelar', suggestionLabel: 'Sugestões de endereço',
};

export function getLocationCopy(locale: LocationLocale): LocationCopy {
  return locale === 'en' ? en : locale === 'pt' ? pt : es;
}
