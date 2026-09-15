export function ok(res, data = null, message = "ok", meta = undefined) {
  return res.json({ success: true, message, data, ...(meta ? { meta } : {}) });
}

export function created(res, data = null, message = "created") {
  return res.status(201).json({ success: true, message, data });
}

export function fail(
  res,
  status = 400,
  message = "error",
  details = undefined,
) {
  return res
    .status(status)
    .json({ success: false, message, ...(details ? { details } : {}) });
}
