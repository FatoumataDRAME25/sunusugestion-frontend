import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

// ─── Helpers de conversion ────────────────────────────────────────────────────

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertKeys(obj: any, converter: (key: string) => string): any {
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeys(item, converter));
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof File) && !(obj instanceof FormData)) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[converter(key)] = convertKeys(obj[key], converter);
      return acc;
    }, {} as any);
  }
  return obj;
}

// ─── Intercepteur ─────────────────────────────────────────────────────────────

export const caseInterceptor: HttpInterceptorFn = (req, next) => {

  // Ne pas transformer les FormData (upload fichiers)
  let modifiedReq = req;
  if (!(req.body instanceof FormData)) {
    const snakeBody = req.body ? convertKeys(req.body, camelToSnake) : req.body;
    modifiedReq = req.clone({ body: snakeBody });
  }

  return next(modifiedReq).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body) {
        return event.clone({ body: convertKeys(event.body, snakeToCamel) });
      }
      return event;
    })
  );
};
