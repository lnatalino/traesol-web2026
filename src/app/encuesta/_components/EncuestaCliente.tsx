"use client";

// src/app/encuesta/_components/EncuestaCliente.tsx
// Componente cliente para el formulario de encuesta

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Star, CheckCircle, AlertCircle, Send, Loader2 } from "lucide-react";
import type { SurveyPublicData, QuestionTipo, RatingLabels } from "@/lib/surveys/types";

const DEFAULT_RATING_LABELS: RatingLabels = {
  "1": "Muy insuficiente",
  "2": "Insuficiente",
  "3": "Regular",
  "4": "Bueno",
  "5": "Sobresaliente"
};

interface ResponseState {
  [questionId: string]: {
    rating_value?: number;
    texto_value?: string;
    opcion_value?: string;
  };
}

export default function EncuestaCliente() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [survey, setSurvey] = useState<SurveyPublicData | null>(null);
  const [responses, setResponses] = useState<ResponseState>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No se proporcionó un token válido");
      setLoading(false);
      return;
    }

    fetch(`/api/encuesta?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          if (data.survey?.ya_completada) {
            setSubmitted(true);
          }
        } else {
          setSurvey(data.survey);
          if (data.survey.ya_completada) {
            setSubmitted(true);
          }
        }
      })
      .catch(() => {
        setError("Error al cargar la encuesta");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleRatingChange = (questionId: string, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], rating_value: value }
    }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], texto_value: value }
    }));
  };

  const handleOptionChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], opcion_value: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey || !token) return;

    // Validar respuestas requeridas
    const missingRequired = survey.questions.filter(q => {
      if (!q.requerida) return false;
      const response = responses[q.id];
      if (!response) return true;
      if (q.tipo === "rating" && !response.rating_value) return true;
      if (q.tipo === "texto_libre" && !response.texto_value?.trim()) return true;
      if (q.tipo === "opcion_multiple" && !response.opcion_value) return true;
      return false;
    });

    if (missingRequired.length > 0) {
      setError("Por favor responde todas las preguntas marcadas como obligatorias");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formattedResponses = Object.entries(responses).map(([question_id, data]) => ({
        question_id,
        ...data
      }));

      const res = await fetch("/api/encuesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, responses: formattedResponses })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al enviar respuestas");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  // Estados de carga/error
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No se pudo cargar la encuesta</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Muchas gracias!</h1>
          <p className="text-gray-600 mb-6">
            Tu opinión es muy valiosa para nosotros y nos ayuda a seguir mejorando.
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ¿Tienes más comentarios?<br />
              Escríbenos a{" "}
              <a href="mailto:contacto@fundaciontraesol.cl" className="font-medium underline">
                contacto@fundaciontraesol.cl
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold mb-2">{survey.template_nombre}</h1>
            {survey.template_descripcion && (
              <p className="text-blue-100">{survey.template_descripcion}</p>
            )}
          </div>
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-gray-600">
              Hola <span className="font-medium text-gray-900">{survey.nombre_destinatario}</span>,
            </p>
            <p className="text-gray-600 mt-1">
              Queremos conocer tu experiencia en{" "}
              <span className="font-medium text-gray-900">{survey.operativo_nombre}</span>
              {survey.operativo_fecha && (
                <span className="text-gray-500">
                  {" "}({new Date(survey.operativo_fecha).toLocaleDateString("es-CL", {
                    year: "numeric",
                    month: "long"
                  })})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">
                    {question.texto}
                    {question.requerida && <span className="text-red-500 ml-1">*</span>}
                  </p>
                </div>
              </div>

              {/* Rating Question */}
              {question.tipo === "rating" && (
                <RatingInput
                  value={responses[question.id]?.rating_value}
                  onChange={(v) => handleRatingChange(question.id, v)}
                  labels={question.rating_labels || DEFAULT_RATING_LABELS}
                />
              )}

              {/* Text Question */}
              {question.tipo === "texto_libre" && (
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={4}
                  placeholder="Escribe tu respuesta aquí..."
                  value={responses[question.id]?.texto_value || ""}
                  onChange={(e) => handleTextChange(question.id, e.target.value)}
                />
              )}

              {/* Multiple Choice Question */}
              {question.tipo === "opcion_multiple" && question.opciones && (
                <div className="space-y-2">
                  {question.opciones.map((opcion) => (
                    <label
                      key={opcion}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        responses[question.id]?.opcion_value === opcion
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={opcion}
                        checked={responses[question.id]?.opcion_value === opcion}
                        onChange={() => handleOptionChange(question.id, opcion)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-medium text-lg shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Respuestas
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © {new Date().getFullYear()} Fundación Traesol
        </p>
      </div>
    </div>
  );
}

// Componente para rating con estrellas
function RatingInput({
  value,
  onChange,
  labels
}: {
  value?: number;
  onChange: (v: number) => void;
  labels: RatingLabels;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            onMouseEnter={() => setHovered(rating)}
            onMouseLeave={() => setHovered(null)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                rating <= displayValue
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="text-center">
        <span className="text-sm font-medium text-gray-700">
          {displayValue ? labels[displayValue.toString() as keyof RatingLabels] : "Selecciona una puntuación"}
        </span>
      </div>
      {/* Labels pequeños */}
      <div className="flex justify-between text-xs text-gray-500 px-2">
        <span>{labels["1"]}</span>
        <span>{labels["5"]}</span>
      </div>
    </div>
  );
}
