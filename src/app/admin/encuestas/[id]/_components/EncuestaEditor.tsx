"use client";

// src/app/admin/encuestas/[id]/_components/EncuestaEditor.tsx
// Editor de preguntas de encuesta

import { useState } from "react";
import { 
  Plus, Trash2, GripVertical, Star, MessageSquare, List, 
  Save, Loader2, ChevronDown, ChevronUp, Settings, ToggleLeft, ToggleRight
} from "lucide-react";

interface Question {
  id: string;
  texto: string;
  tipo: "rating" | "texto_libre" | "opcion_multiple";
  rating_labels: Record<string, string> | null;
  opciones: string[] | null;
  requerida: boolean;
  orden: number;
  activa: boolean;
}

interface TemplateConfig {
  nombre: string;
  descripcion: string;
  tipo: "VOLUNTARIOS_OPERATIVO" | "PACIENTES_QUIRURGICO";
  delay_days: number;
  activo: boolean;
}

interface Props {
  templateId: string;
  initialTemplate: TemplateConfig;
  initialQuestions: Question[];
}

const DEFAULT_RATING_LABELS = {
  "1": "Muy insuficiente",
  "2": "Insuficiente",
  "3": "Regular",
  "4": "Bueno",
  "5": "Sobresaliente"
};

export default function EncuestaEditor({ templateId, initialTemplate, initialQuestions }: Props) {
  const [template, setTemplate] = useState(initialTemplate);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Nueva pregunta temporal
  const [newQuestion, setNewQuestion] = useState<{
    texto: string;
    tipo: "rating" | "texto_libre" | "opcion_multiple";
    opciones: string[];
  } | null>(null);

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Guardar configuración del template
  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const res = await fetch(`/api/admin/surveys/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template)
      });
      if (!res.ok) throw new Error("Error al guardar");
      showMessage("Configuración guardada");
    } catch {
      showMessage("Error al guardar configuración", true);
    } finally {
      setSavingTemplate(false);
    }
  };

  // Agregar nueva pregunta
  const handleAddQuestion = async () => {
    if (!newQuestion || !newQuestion.texto.trim()) return;

    setSavingQuestion("new");
    try {
      const res = await fetch(`/api/admin/surveys/${templateId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: newQuestion.texto,
          tipo: newQuestion.tipo,
          rating_labels: newQuestion.tipo === "rating" ? DEFAULT_RATING_LABELS : null,
          opciones: newQuestion.tipo === "opcion_multiple" ? newQuestion.opciones : null,
          requerida: true,
          activa: true
        })
      });

      if (!res.ok) throw new Error("Error al crear pregunta");
      
      const { question } = await res.json();
      setQuestions([...questions, question]);
      setNewQuestion(null);
      showMessage("Pregunta agregada");
    } catch {
      showMessage("Error al agregar pregunta", true);
    } finally {
      setSavingQuestion(null);
    }
  };

  // Actualizar pregunta
  const handleUpdateQuestion = async (questionId: string, updates: Partial<Question>) => {
    setSavingQuestion(questionId);
    try {
      const res = await fetch(`/api/admin/surveys/${templateId}/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error("Error al actualizar");
      
      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ));
      showMessage("Pregunta actualizada");
    } catch {
      showMessage("Error al actualizar pregunta", true);
    } finally {
      setSavingQuestion(null);
    }
  };

  // Eliminar pregunta
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("¿Eliminar esta pregunta?")) return;

    setSavingQuestion(questionId);
    try {
      const res = await fetch(`/api/admin/surveys/${templateId}/questions/${questionId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Error al eliminar");
      
      setQuestions(questions.filter(q => q.id !== questionId));
      showMessage("Pregunta eliminada");
    } catch {
      showMessage("Error al eliminar pregunta", true);
    } finally {
      setSavingQuestion(null);
    }
  };

  // Toggle activo de pregunta
  const handleToggleQuestion = (questionId: string, activa: boolean) => {
    handleUpdateQuestion(questionId, { activa });
  };

  const questionIcons = {
    rating: <Star className="w-4 h-4" />,
    texto_libre: <MessageSquare className="w-4 h-4" />,
    opcion_multiple: <List className="w-4 h-4" />
  };

  const questionLabels = {
    rating: "Puntuación 1-5",
    texto_libre: "Texto libre",
    opcion_multiple: "Opción múltiple"
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Settings toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Configuración de la Encuesta</span>
          </div>
          {showSettings ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showSettings && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={template.nombre}
                onChange={(e) => setTemplate({ ...template, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={template.descripcion}
                onChange={(e) => setTemplate({ ...template, descripcion: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delay (días)</label>
                <select
                  value={template.delay_days}
                  onChange={(e) => setTemplate({ ...template, delay_days: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {[1, 2, 3, 5, 7, 14].map(d => (
                    <option key={d} value={d}>{d} día{d > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.activo}
                    onChange={(e) => setTemplate({ ...template, activo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Encuesta activa</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Configuración
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Preguntas ({questions.length})</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`px-6 py-4 ${!question.activa ? "opacity-50 bg-gray-50" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 text-gray-400 pt-1">
                  <GripVertical className="w-4 h-4 cursor-grab" />
                  <span className="text-sm font-medium">{index + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  {expandedQuestion === question.id ? (
                    // Modo edición
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={question.texto}
                        onChange={(e) => setQuestions(questions.map(q =>
                          q.id === question.id ? { ...q, texto: e.target.value } : q
                        ))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={question.requerida}
                            onChange={(e) => setQuestions(questions.map(q =>
                              q.id === question.id ? { ...q, requerida: e.target.checked } : q
                            ))}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          Obligatoria
                        </label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setExpandedQuestion(null)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            handleUpdateQuestion(question.id, {
                              texto: question.texto,
                              requerida: question.requerida
                            });
                            setExpandedQuestion(null);
                          }}
                          disabled={savingQuestion === question.id}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingQuestion === question.id ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo vista
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedQuestion(question.id)}
                    >
                      <p className="text-gray-900">
                        {question.texto}
                        {question.requerida && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                          question.tipo === "rating" ? "bg-yellow-100 text-yellow-700" :
                          question.tipo === "texto_libre" ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {questionIcons[question.tipo]}
                          {questionLabels[question.tipo]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleQuestion(question.id, !question.activa)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                    title={question.activa ? "Desactivar" : "Activar"}
                  >
                    {question.activa ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && !newQuestion && (
            <div className="px-6 py-12 text-center text-gray-500">
              No hay preguntas. Agrega la primera pregunta.
            </div>
          )}
        </div>

        {/* Agregar nueva pregunta */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {newQuestion ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Escribe la pregunta..."
                value={newQuestion.texto}
                onChange={(e) => setNewQuestion({ ...newQuestion, texto: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                autoFocus
              />
              <div className="flex gap-2">
                {(["rating", "texto_libre", "opcion_multiple"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setNewQuestion({ ...newQuestion, tipo })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                      newQuestion.tipo === tipo
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {questionIcons[tipo]}
                    {questionLabels[tipo]}
                  </button>
                ))}
              </div>

              {newQuestion.tipo === "opcion_multiple" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Opciones:</label>
                  {newQuestion.opciones.map((op, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={op}
                        onChange={(e) => {
                          const newOps = [...newQuestion.opciones];
                          newOps[i] = e.target.value;
                          setNewQuestion({ ...newQuestion, opciones: newOps });
                        }}
                        placeholder={`Opción ${i + 1}`}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      {newQuestion.opciones.length > 2 && (
                        <button
                          onClick={() => {
                            const newOps = newQuestion.opciones.filter((_, idx) => idx !== i);
                            setNewQuestion({ ...newQuestion, opciones: newOps });
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setNewQuestion({ ...newQuestion, opciones: [...newQuestion.opciones, ""] })}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Agregar opción
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setNewQuestion(null)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddQuestion}
                  disabled={!newQuestion.texto.trim() || savingQuestion === "new"}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingQuestion === "new" && <Loader2 className="w-3 h-3 animate-spin" />}
                  Agregar Pregunta
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setNewQuestion({ texto: "", tipo: "rating", opciones: ["", ""] })}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Pregunta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
